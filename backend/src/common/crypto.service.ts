import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Serviço de criptografia AES-256-GCM para tokens sensíveis
 */
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 16;
  private readonly tagLength = 16;

  /**
   * Deriva uma chave a partir da senha mestra usando scrypt
   */
  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.keyLength)) as Buffer;
  }

  /**
   * Criptografa um texto usando AES-256-GCM
   * Formato: salt(16) + iv(16) + tag(16) + ciphertext
   */
  async encrypt(plaintext: string, password: string): Promise<string> {
    const salt = randomBytes(this.saltLength);
    const iv = randomBytes(this.ivLength);
    const key = await this.deriveKey(password, salt);

    const cipher = createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Combina: salt + iv + tag + encrypted
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString('base64');
  }

  /**
   * Descriptografa um texto criptografado com AES-256-GCM
   */
  async decrypt(ciphertext: string, password: string): Promise<string> {
    const buffer = Buffer.from(ciphertext, 'base64');

    // Extrai componentes
    const salt = buffer.subarray(0, this.saltLength);
    const iv = buffer.subarray(
      this.saltLength,
      this.saltLength + this.ivLength,
    );
    const tag = buffer.subarray(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.tagLength,
    );
    const encrypted = buffer.subarray(
      this.saltLength + this.ivLength + this.tagLength,
    );

    const key = await this.deriveKey(password, salt);

    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
