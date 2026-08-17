// Scratch script to generate consistent mock data
import fs from 'fs';
import path from 'path';

function generateSignatureData(seedPattern, targetFingerprint) {
  // Let's create a 16x16 compressed grid
  const compGrid = Array.from({ length: 16 }, () => Array(16).fill(0));
  
  // Draw some characteristic signature strokes
  if (seedPattern === 'A') {
    // Flourish 1: diagonal slant from top-left to middle
    for (let i = 2; i <= 10; i++) {
      compGrid[i][Math.min(15, i + 1)] = 1;
      compGrid[i][Math.min(15, i + 2)] = 1;
    }
    // Loop
    for (let j = 4; j <= 9; j++) compGrid[4][j] = 1;
    for (let j = 4; j <= 9; j++) compGrid[8][j] = 1;
    for (let i = 4; i <= 8; i++) compGrid[i][4] = 1;
    for (let i = 4; i <= 8; i++) compGrid[i][9] = 1;
    // Underline flourish
    for (let j = 2; j <= 14; j++) compGrid[13][j] = 1;
    for (let j = 10; j <= 15; j++) compGrid[12][j] = 1;
  } else {
    // Pattern B (similar variant)
    for (let i = 2; i <= 10; i++) {
      compGrid[i][Math.min(15, i + 2)] = 1;
      compGrid[i][Math.min(15, i + 3)] = 1;
    }
    for (let j = 5; j <= 10; j++) compGrid[4][j] = 1;
    for (let j = 5; j <= 10; j++) compGrid[8][j] = 1;
    for (let i = 4; i <= 8; i++) compGrid[i][5] = 1;
    for (let i = 4; i <= 8; i++) compGrid[i][10] = 1;
    for (let j = 3; j <= 15; j++) compGrid[13][j] = 1;
    for (let j = 11; j <= 15; j++) compGrid[12][j] = 1;
  }

  // Row and column densities
  const row_density = compGrid.map(row => row.reduce((a, b) => a + b, 0));
  const col_density = Array(16).fill(0);
  for (let c = 0; c < 16; c++) {
    for (let r = 0; r < 16; r++) {
      col_density[c] += compGrid[r][c];
    }
  }

  // 64x64 binary matrix: expand each 16x16 cell into 4x4 with plausible ink distribution
  const binary_matrix_rows = [];
  for (let r = 0; r < 16; r++) {
    const subRows = ['', '', '', ''];
    for (let c = 0; c < 16; c++) {
      const isInk = compGrid[r][c] === 1;
      for (let sr = 0; sr < 4; sr++) {
        if (isInk) {
          // Add some organic ink noise
          const inkPattern = (sr === 1 || sr === 2) ? '1110' : '0110';
          subRows[sr] += inkPattern;
        } else {
          subRows[sr] += '0000';
        }
      }
    }
    binary_matrix_rows.push(...subRows);
  }

  const compressed_matrix = compGrid.map(r => r.join(''));

  return {
    binary_matrix: binary_matrix_rows,
    compressed_matrix: compressed_matrix,
    row_density: row_density,
    col_density: col_density,
    fingerprint_string: targetFingerprint
  };
}

function computeLCS(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Traceback
  let i = m, j = n;
  let lcsArr = [];
  const traceback = [[i, j]];

  while (i > 0 && j > 0) {
    if (s1[i - 1] === s2[j - 1]) {
      lcsArr.unshift(s1[i - 1]);
      i--;
      j--;
      traceback.unshift([i, j]);
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
      traceback.unshift([i, j]);
    } else {
      j--;
      traceback.unshift([i, j]);
    }
  }

  while (i > 0) {
    i--;
    traceback.unshift([i, 0]);
  }
  while (j > 0) {
    j--;
    traceback.unshift([0, j]);
  }

  const lcs_string = lcsArr.join('');
  const lcs_length = dp[m][n];
  const similarity_percent = parseFloat(((lcs_length / 16) * 100).toFixed(2));

  return {
    lcs_length,
    lcs_string,
    similarity_percent,
    dp_table: dp,
    traceback_path: traceback,
    verdict: similarity_percent >= 60.0 ? "likely match" : "likely different"
  };
}

const sigA = generateSignatureData('A', "015AF87025978753");
const sigB = generateSignatureData('B', "0158F87025979853");
const comparison = computeLCS(sigA.fingerprint_string, sigB.fingerprint_string);

const fullPayload = {
  signature_a: sigA,
  signature_b: sigB,
  comparison: comparison,
  params_used: {
    threshold: 128,
    block_size: 4,
    ink_ratio: 0.10,
    quantization_levels: 16,
    working_resolution: 64
  }
};

const targetDir = 'c:/Users/HP/Hackathon/Offline-Signature-Matching-using-LCS-algo/frontend/src/data';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
fs.writeFileSync(path.join(targetDir, 'mockResponse.json'), JSON.stringify(fullPayload, null, 2));
console.log('Successfully generated mockResponse.json with LCS: ', comparison.lcs_string, 'Length:', comparison.lcs_length, 'Similarity:', comparison.similarity_percent + '%');
