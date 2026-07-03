export class TokenService {
  count(text: string): number {
    return Math.ceil(text.length / 4);
  }

  countForQwen(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    const chineseTokens = Math.ceil(chineseChars * 1.3);
    const otherTokens = Math.ceil(otherChars / 4);
    return chineseTokens + otherTokens;
  }
}
