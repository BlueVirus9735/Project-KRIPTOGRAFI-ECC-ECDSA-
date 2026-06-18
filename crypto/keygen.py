import sys
import os
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

def generate_keys(key_path):
    if not os.path.exists(key_path):
        os.makedirs(key_path)
        
    private_key = ec.generate_private_key(ec.SECP256K1())

    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    public_key = private_key.public_key()

    pem_public = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    private_key_file = os.path.join(key_path, "private_key.pem")
    public_key_file = os.path.join(key_path, "public_key.pem")
    
    with open(private_key_file, "wb") as f:
        f.write(pem_private)
    
    with open(public_key_file, "wb") as f:
        f.write(pem_public)
    
    print(f"Keys generated successfully in {key_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python keygen.py <key_path>")
        sys.exit(1)
    generate_keys(sys.argv[1])
