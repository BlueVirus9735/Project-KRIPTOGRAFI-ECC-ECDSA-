import sys
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

def sign_document(private_key_path, document_path, signature_path):

    with open(private_key_path, "rb") as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None
        )

    with open(document_path, "rb") as f:
        data = f.read()

    signature = private_key.sign(
        data,
        ec.ECDSA(hashes.SHA256())
    )

    with open(signature_path, "wb") as f:
        f.write(signature)
    
    print(f"Document signed successfully. Signature saved in {signature_path}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python sign.py <private_key_path> <document_path> <signature_path>")
        sys.exit(1)
    sign_document(sys.argv[1], sys.argv[2], sys.argv[3])
