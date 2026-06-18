import sys
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


EPHEMERAL_PUBKEY_LEN = 65
NONCE_LEN = 12


def decrypt_file(private_key_path, input_path, output_path):
    
    with open(private_key_path, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    with open(input_path, "rb") as f:
        data = f.read()

    ephemeral_pub_bytes = data[:EPHEMERAL_PUBKEY_LEN]
    ephemeral_public_key = ec.EllipticCurvePublicKey.from_encoded_point(
        ec.SECP256K1(), ephemeral_pub_bytes
    )

    nonce = data[EPHEMERAL_PUBKEY_LEN : EPHEMERAL_PUBKEY_LEN + NONCE_LEN]

    ciphertext = data[EPHEMERAL_PUBKEY_LEN + NONCE_LEN :]

    shared_secret = private_key.exchange(ec.ECDH(), ephemeral_public_key)

    aes_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"ecies-enc",
    ).derive(shared_secret)

    aesgcm = AESGCM(aes_key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)

    with open(output_path, "wb") as f:
        f.write(plaintext)

    print(f"File decrypted successfully: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python decrypt.py <private_key.pem> <input_file.enc> <output_file>")
        sys.exit(1)
    decrypt_file(sys.argv[1], sys.argv[2], sys.argv[3])
