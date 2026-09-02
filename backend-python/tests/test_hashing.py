"""Verifica que el hashing sea Argon2id con los parámetros OWASP de openapi.yaml
(m = 19456, t = 2, p = 1) y que jamás caiga en otro algoritmo.
"""
from app.services.hashing import Argon2Hasher

PLAIN = "S3gura-y-larga_2026!"


def test_produces_argon2id_phc_with_owasp_params():
    h = Argon2Hasher().hash(PLAIN)
    # El prefijo PHC embebe algoritmo + versión + parámetros: prueba que es
    # Argon2id con m=19456, t=2, p=1 y descarta bcrypt/scrypt/SHA.
    assert h.startswith("$argon2id$v=19$m=19456,t=2,p=1$")


def test_verify_accepts_correct_and_rejects_wrong():
    hasher = Argon2Hasher()
    h = hasher.hash(PLAIN)
    assert hasher.verify(h, PLAIN) is True
    assert hasher.verify(h, "contraseña-incorrecta") is False


def test_verify_returns_false_on_corrupt_hash():
    assert Argon2Hasher().verify("no-es-un-hash-phc", PLAIN) is False


def test_needs_rehash_false_for_fresh_hash():
    hasher = Argon2Hasher()
    assert hasher.needs_rehash(hasher.hash(PLAIN)) is False
