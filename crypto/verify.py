import sys
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

def verify_signature(public_key_path, document_path, signature_path):

    with open(public_key_path, "rb") as key_file:
        public_key = serialization.load_pem_public_key(
            key_file.read()
        )

    with open(document_path, "rb") as f:
        data = f.read()

    with open(signature_path, "rb") as f:
        signature = f.read()

    try:
        public_key.verify(
            signature,
            data,
            ec.ECDSA(hashes.SHA256())
        )
        print("Signature is VALID")
        return True
    except InvalidSignature:
        print("Signature is INVALID")
        return False
    except Exception as e:
        print(f"Error during verification: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python verify.py <public_key_path> <document_path> <signature_path>")
        sys.exit(1)
    verify_signature(sys.argv[1], sys.argv[2], sys.argv[3])
