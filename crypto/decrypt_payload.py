"""
crypto/decrypt_payload.py
Dekripsi base64-encoded ciphertext (ECIES) kembali ke plaintext JSON.

Usage: python decrypt_payload.py <private_key.pem> <input_b64_file> <output_json_file>
"""
import sys
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

EPHEMERAL_PUBKEY_LEN = 65  # Uncompressed EC point on SECP256K1
NONCE_LEN = 12


def decrypt_payload(private_key_path, input_path, output_path):
    with open(private_key_path, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    with open(input_path, "r", encoding="utf-8") as f:
        b64_data = f.read().strip()

    # Decode base64
    raw = base64.b64decode(b64_data)

    # Parse components
    ephemeral_pub_bytes = raw[:EPHEMERAL_PUBKEY_LEN]
    nonce = raw[EPHEMERAL_PUBKEY_LEN: EPHEMERAL_PUBKEY_LEN + NONCE_LEN]
    ciphertext = raw[EPHEMERAL_PUBKEY_LEN + NONCE_LEN:]

    # Reconstruct ephemeral public key using the curve of the recipient's private key
    ephemeral_public_key = ec.EllipticCurvePublicKey.from_encoded_point(
        private_key.curve, ephemeral_pub_bytes
    )


    # ECDH shared secret
    shared_secret = private_key.exchange(ec.ECDH(), ephemeral_public_key)

    # Derive AES key
    aes_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"ecies-payload-enc",
    ).derive(shared_secret)

    # AES-GCM decrypt
    aesgcm = AESGCM(aes_key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)

    with open(output_path, "wb") as f:
        f.write(plaintext)

    print(f"Payload decrypted successfully. Length: {len(plaintext)} bytes")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python decrypt_payload.py <private_key.pem> <input_b64> <output_json>")
        sys.exit(1)
    decrypt_payload(sys.argv[1], sys.argv[2], sys.argv[3])
