"""Slug y ruta de imagen de ejercicios — fuente única compartida.

Usado por generate_seed.py (image_url) y generate_exercise_prompts.py (nombre de
archivo destino). La MISMA lógica está replicada en TS:
src/lib/domain/exercises.ts (exerciseImageSlug / EXERCISE_IMG_BASE).
Si cambias una, cambia la otra.
"""

import re
import unicodedata

# Punto único a tocar si se migra a Supabase Storage (cambiar por la URL del bucket).
IMG_BASE = "/exercises"
IMG_EXT = "webp"


def slugify(name: str) -> str:
    """`Pec Deck (Aperturas en Maquina)` -> `pec-deck`."""
    # Quitar todo lo que va entre/después de un paréntesis
    base = re.split(r"\s*\(", name, maxsplit=1)[0]
    # Quitar acentos
    base = unicodedata.normalize("NFKD", base)
    base = "".join(c for c in base if not unicodedata.combining(c))
    base = base.lower()
    # Solo [a-z0-9], el resto -> guion
    base = re.sub(r"[^a-z0-9]+", "-", base)
    return base.strip("-")


def image_filename(index: int, name: str) -> str:
    """index es 1-based. -> `001-press-de-banca-plano.webp`."""
    return f"{index:03d}-{slugify(name)}.{IMG_EXT}"


def image_url(index: int, name: str) -> str:
    """-> `/exercises/001-press-de-banca-plano.webp`."""
    return f"{IMG_BASE}/{image_filename(index, name)}"
