/* eslint-disable */

// @ts-nocheck
if (!('randomUUID' in window.crypto)) {
  window.crypto.randomUUID = function randomUUID(): string {
    return (
      [1e7] + -1e3 + -4e3 + -8e3 + -1e11
    ).replace(/[018]/g,
      (ch: number) => (ch ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> ch / 4).toString(16)
    )
  }
}
