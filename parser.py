"""
The module exposes a single public helper – :func:`json_structure` – that keeps the original
signature so it can be dropped into existing code without changes. Internally the logic is
split into small, typed helpers grouped in an :class:`AxieDecoder` facade for clarity and
potential re-use (e.g. unit–testing, CLI, etc.).
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple
import json

# ---------------------------------------------------------------------------
# Mapping constants – collected at the top so they are easy to tweak
# ---------------------------------------------------------------------------
CLASS_MAPPING: dict[str, str] = {
    "00100": "aquatic",
    "00000": "beast",
    "00010": "bird",
    "00001": "bug",
    "00101": "reptile",
    "00011": "plant",
    "10010": "dusk",
    "10001": "dawn",
    "10000": "mech",
}

COLOR_MAPPING: dict[str, str] = {
    "000": "00",
    "001": "01",
    "010": "02",
    "011": "03",
    "100": "04",
}

SPECIAL_BODY_MAP = {"001": "frosty", "011": "nightmare", "010": "wavy"}
COMMON_BODY_MAP = {
    "000000011": "curly",
    "000000010": "fuzzy",
    "100000001": "wetdog",
    "110000000": "bigyak",
    "000000001": "spiky",
    "100000000": "sumo",
    # fall-back → "normal"
}

SPECIAL_PART_MAP: dict[str | None, str] = {
    None: "0000",
    "Japan": "0011",
    "Xmas2018": "0100",
    "Xmas2019": "0101",
    "Bionic": "0010",
    "Mystic": "0001",
    "Summer2022": "0110",
    "SummerShiny2022": "1001",
    "Nightmare": "1100",
    "NightmareShiny": "1101",
}

STAGE_BIT_MAP = {
    "eyes": 142,
    "mouth": 206,
    "ears": 270,
    "horn": 334,
    "back": 398,
    "tail": 462,
}

DOMINANT_SLICE_MAP = {
    "eyes": (155, 165),
    "mouth": (219, 229),
    "ears": (283, 293),
    "horn": (347, 357),
    "back": (411, 421),
    "tail": (475, 485),
}

RECESSIVE_SLICE_MAP = {
    "eyes": {"r1": (168, 178), "r2": (181, 191)},
    "mouth": {"r1": (232, 242), "r2": (245, 255)},
    "ears": {"r1": (296, 306), "r2": (309, 319)},
    "horn": {"r1": (360, 370), "r2": (373, 383)},
    "back": {"r1": (424, 434), "r2": (437, 447)},
    "tail": {"r1": (488, 498), "r2": (501, 511)},
}

SPECIAL_SLICE_MAP = {
    "eyes": (149, 153),
    "mouth": (213, 217),
    "ears": (277, 281),
    "horn": (341, 345),
    "back": (405, 409),
    "tail": (469, 473),
}

COLOR_SLICE_MAP = {"d": (95, 98), "r1": (101, 104), "r2": (107, 110)}

PARTS_MAPPING_FILE = Path(__file__).with_name("parts_mapping.json")

# ---------------------------------------------------------------------------
# Helper dataclass wrappers
# ---------------------------------------------------------------------------
@dataclass(slots=True, frozen=True)
class PartInfo:
    """A tiny wrapper for a decoded part."""

    id: str
    name: str
    class_: str
    type_: str
    stage: int
    special: str | None
    original_part: str | None = None
    original_name: str | None = None

    def as_dict(self) -> dict[str, str | int | None]:
        return {
            "id": self.id,
            "name": self.name,
            "class": self.class_,
            "type": self.type_.lower(),
            "stage": self.stage,
            "specialGenes": self.special,
            "originalPart": self.original_part,
            "originalPartName": self.original_name,
        }


# ---------------------------------------------------------------------------
# Core decoder implementation
# ---------------------------------------------------------------------------
class AxieDecoder:
    """Encapsulates all decoding helpers in a single cohesive unit."""

    def __init__(self, parts_db: List[dict]):
        self.parts_db = parts_db

    def json_structure(self, hex_str: str) -> str:
        binary = self._hex_to_bin(hex_str)
        result = {
            "class": self._identify_class(binary),
            "color": self._identify_colors(binary),
            "body": self._identify_body(binary),
        }
        dom = self._identify_parts(binary)
        rec = self._identify_recessive_parts(binary)
        for part in DOMINANT_SLICE_MAP:
            result[part] = {
                "d": dom.get(part, "Unknown Part"),
                "r1": rec.get(f"{part}_r1", "Unknown Recessive Part"),
                "r2": rec.get(f"{part}_r2", "Unknown Recessive Part"),
            }

        result["specialCollection"] = self._extract_special_collection(binary, dom, result["body"])
        return json.dumps(result, indent=2, ensure_ascii=False)

    @staticmethod
    def _hex_to_bin(hex_str: str) -> str:
        if hex_str.startswith(("0x", "0X")):
            hex_str = hex_str[2:]
        return bin(int(hex_str, 16))[2:].zfill(512)[-512:]

    @staticmethod
    def _normalize(bits: str, length: int) -> str:
        return bits.zfill(length)

    def _identify_class(self, binary: str) -> str:
        return CLASS_MAPPING.get(binary[0:5], "Unknown Class")

    def _identify_colors(self, binary: str) -> Dict[str, str]:
        return {k: COLOR_MAPPING.get(binary[s:e], "Unknown") for k, (s, e) in COLOR_SLICE_MAP.items()}

    def _identify_body(self, binary: str) -> Dict[str, str]:
        special_bits = binary[62:65]
        dominant = (
            SPECIAL_BODY_MAP.get(special_bits)
            if special_bits in SPECIAL_BODY_MAP
            else self._decode_common_body(binary[65:74])
        )
        return {
            "d": dominant,
            "r1": self._decode_common_body(binary[74:83]),
            "r2": self._decode_common_body(binary[83:92]),
        }

    @staticmethod
    def _decode_common_body(bits9: str) -> str:
        return COMMON_BODY_MAP.get(bits9, "normal")

    def _identify_parts(self, binary: str) -> Dict[str, dict]:
        out: Dict[str, dict] = {}
        for part, (s, e) in DOMINANT_SLICE_MAP.items():
            stage = 1 if binary[STAGE_BIT_MAP[part]] == "0" else 2
            special = self._special_gene(binary, part)
            norm_slice = self._normalize(binary[s:e], self._expected_len(part, stage, special))
            match = self._match_part(part, stage, special, norm_slice)
            out[part] = match.as_dict() if match else "Unknown Part"
        return out

    def _identify_recessive_parts(self, binary: str) -> Dict[str, dict]:
        out: Dict[str, dict] = {}
        for part, aliases in RECESSIVE_SLICE_MAP.items():
            for alias, (s, e) in aliases.items():
                norm_slice = self._normalize(binary[s:e], self._expected_len(part, 1, None))
                match = self._match_part(part, 1, None, norm_slice)
                out[f"{part}_{alias}"] = {
                    "id": match.id,
                    "class": match.class_,
                    "name": match.name,
                } if match else "Unknown Recessive Part"
        return out

    def _special_gene(self, binary: str, part: str) -> str | None:
        s, e = SPECIAL_SLICE_MAP[part]
        key = binary[s:e]
        for name, bits in SPECIAL_PART_MAP.items():
            if key == bits or (isinstance(bits, list) and key in bits):
                return name
        return None

    def _expected_len(self, part: str, stage: int, special: str | None) -> int | None:
        for p in self.parts_db:
            if (
                p["type"].lower() == part
                and p["stage"] == stage
                and ((special and p["specialGenes"] == special) or (not special and p["specialGenes"] is None))
            ):
                return len(p["binary"])
        return None

    def _match_part(self, part: str, stage: int, special: str | None, bits: str) -> PartInfo | None:
        part_type = part.capitalize()
        for cand in self.parts_db:
            if (
                cand["type"] == part_type
                and cand["stage"] == stage
                and cand["binary"] == bits
                and ((special and cand["specialGenes"] == special) or (not special and cand["specialGenes"] is None))
            ):
                return PartInfo(
                    id=cand["id"],
                    name=cand["name"],
                    class_=cand["class"],
                    type_=cand["type"],
                    stage=stage,
                    special=special,
                    original_part=cand.get("originalPart"),
                    original_name=cand.get("originalPartName"),
                )
        if special:
            return self._match_part(part, stage, None, bits)
        return None

    def _extract_special_collection(self, binary: str, dom_parts: Dict[str, dict], body: dict) -> dict:
        title_bits = binary[62:65]
        title = None
        if title_bits == "101":
            title = "MEO"
        elif title_bits == "111":
            title = "MEO II"
        elif title_bits == "011":
            title = "ORIGIN"

        counter = {
            "AgamoGenesis": 0,
            "Mystic": 0,
            "ORIGIN": 0,
            "MEO": 0,
            "MEO II": 0,
            "Xmas": 0,
            "Shiny": 0,
            "Japanese": 0,
            "Nightmare": 0,
            "Summer": 0,
        }

        for part in dom_parts.values():
            if not isinstance(part, dict):
                continue
            special = part.get("specialGenes")
            if special == "Bionic":
                counter["AgamoGenesis"] += 1
            elif special == "Mystic":
                counter["Mystic"] += 1
            elif special in ("Xmas2018", "Xmas2019"):
                counter["Xmas"] += 1
            elif special in ("SummerShiny2022", "NightmareShiny"):
                counter["Shiny"] += 1
            elif special == "Japan":
                counter["Japanese"] += 1
            elif special in ("Nightmare", "NightmareShiny"):
                counter["Nightmare"] += 1
            elif special in ("Summer2022", "SummerShiny2022"):
                counter["Summer"] += 1

        if body.get("d") == "nightmare":
            counter["Nightmare"] += 1

        if title:
            counter[title] += 1

        return {k: v for k, v in counter.items() if v > 0}

def _load_parts_db(filepath: Path = PARTS_MAPPING_FILE) -> List[dict]:
    if not filepath.exists():
        raise FileNotFoundError(f"Parts mapping file not found: {filepath}")
    try:
        with filepath.open(encoding="utf-8") as fh:
            return json.load(fh)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in parts mapping: {exc}") from exc


def json_structure(hex_string: str) -> str:
    decoder = AxieDecoder(_load_parts_db())
    return decoder.json_structure(hex_string)
