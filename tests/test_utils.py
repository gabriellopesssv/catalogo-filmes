import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import validar_nota, formatar_ano


def test_validar_nota_valida():
    assert validar_nota(5) == True
    assert validar_nota(0) == True
    assert validar_nota(10) == True
    assert validar_nota(7.5) == True
    assert validar_nota("8") == True
    assert validar_nota("9.5") == True


def test_validar_nota_invalida():
    assert validar_nota(-1) == False
    assert validar_nota(11) == False
    assert validar_nota(100) == False
    assert validar_nota("abc") == False
    assert validar_nota(None) == False
    assert validar_nota("") == False


def test_formatar_ano_completo():
    assert formatar_ano(2024) == 2024
    assert formatar_ano(1999) == 1999
    assert formatar_ano("2024") == 2024


def test_formatar_ano_curto():
    assert formatar_ano(25) == 2025
    assert formatar_ano(99) == 1999
    assert formatar_ano(50) == 1950
    assert formatar_ano(49) == 2049


def test_formatar_ano_invalido():
    assert formatar_ano("abc") is None
    assert formatar_ano(None) is None
    assert formatar_ano("") is None
