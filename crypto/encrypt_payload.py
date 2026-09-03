"""
crypto/encrypt_payload.py
Enkripsi string JSON menggunakan ECIES (ECC SECP256K1 + AES-GCM).
Output: base64-encoded ciphertext (bisa disimpan di database sebagai LONGTEXT)

Usage: python encrypt_payload.py <public_key.pem> <input_json_file> <output_b64_file>
"""
import sys
import os
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt_payload(public_key_path, input_path, output_path):
    with open(public_key_path, "rb") as f:
        public_key = serialization.load_pem_public_key(f.read())

    with open(input_path, "rb") as f:
        plaintext = f.read()

    # Generate ephemeral key pair for ECIES using the same curve as the recipient's public key
    ephemeral_private_key = ec.generate_private_key(public_key.curve)
    ephemeral_public_key = ephemeral_private_key.public_key()


    # ECDH shared secret
    shared_secret = ephemeral_private_key.exchange(ec.ECDH(), public_key)

    # Derive AES key via HKDF-SHA256
    aes_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"ecies-payload-enc",
    ).derive(shared_secret)

    # AES-GCM encryption
    nonce = os.urandom(12)
    aesgcm = AESGCM(aes_key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)

    # Serialize ephemeral public key (uncompressed, 65 bytes)
    ephemeral_pub_bytes = ephemeral_public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )

    # Format: [65B ephemeral pubkey][12B nonce][ciphertext]
    raw = ephemeral_pub_bytes + nonce + ciphertext

    # Base64 encode for DB storage
    b64_output = base64.b64encode(raw).decode("utf-8")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(b64_output)

    print(f"Payload encrypted successfully. Length: {len(b64_output)} chars")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python encrypt_payload.py <public_key.pem> <input_json> <output_b64>")
        sys.exit(1)
    encrypt_payload(sys.argv[1], sys.argv[2], sys.argv[3])
