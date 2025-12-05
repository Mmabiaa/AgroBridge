/**
 * Token encryption utilities for secure storage
 * Uses Web Crypto API for encryption/decryption
 */

class TokenEncryption {
  private static readonly ENCRYPTION_KEY_NAME = 'agrobridge_encryption_key';
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;

  /**
   * Generate or retrieve encryption key
   */
  private static async getEncryptionKey(): Promise<CryptoKey> {
    // Try to get existing key from sessionStorage
    const storedKey = sessionStorage.getItem(this.ENCRYPTION_KEY_NAME);
    
    if (storedKey) {
      try {
        const keyData = JSON.parse(storedKey);
        return await crypto.subtle.importKey(
          'jwk',
          keyData,
          { name: this.ALGORITHM, length: this.KEY_LENGTH },
          true,
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.warn('Failed to import stored key, generating new one');
      }
    }

    // Generate new key
    const key = await crypto.subtle.generateKey(
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );

    // Store key in sessionStorage (cleared when browser closes)
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    sessionStorage.setItem(this.ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));

    return key;
  }

  /**
   * Encrypt a token
   */
  static async encrypt(token: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const encoder = new TextEncoder();
      const data = encoder.encode(token);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt
      const encryptedData = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        key,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to unencrypted storage in case of error
      return token;
    }
  }

  /**
   * Decrypt a token
   */
  static async decrypt(encryptedToken: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();

      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        key,
        encryptedData
      );

      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      // Fallback to returning the token as-is (might be unencrypted)
      return encryptedToken;
    }
  }

  /**
   * Check if encryption is supported
   */
  static isSupported(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.subtle.encrypt === 'function';
  }

  /**
   * Clear encryption key (on logout)
   */
  static clearKey(): void {
    sessionStorage.removeItem(this.ENCRYPTION_KEY_NAME);
  }
}

export default TokenEncryption;
