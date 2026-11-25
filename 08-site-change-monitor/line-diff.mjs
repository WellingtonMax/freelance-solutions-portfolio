function lines(text) {
  if (typeof text !== 'string' || text.length > 12000) throw Error('Use no more than 12,000 characters per snapshot.');
  const values = text ? text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n') : [];
  if (values.length > 200) throw Error('Use no more than 200 lines per snapshot.');
  return values;
}
export function diff(before, after) {
  const a = lines(before), b = lines(after);
  const lcs = Array.from({length:a.length+1}, () => new Uint16Array(b.length+1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
    lcs[i][j] = a[i] === b[j] ? 1 + lcs[i+1][j+1] : Math.max(lcs[i+1][j], lcs[i][j+1]);
  const counts = {added:0, removed:0, unchanged:0}, changes = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    let row;
    if (i < a.length && j < b.length && a[i] === b[j]) row = {kind:'unchanged', old:i+1, new:j+1, text:a[i++]}, j++;
    else if (i < a.length && (j === b.length || lcs[i+1][j] >= lcs[i][j+1])) row = {kind:'removed', old:i+1, text:a[i++]};
    else row = {kind:'added', new:j+1, text:b[j++]};
    changes.push(row);
    counts[row.kind]++;
  }
  return {counts, changes};
}
