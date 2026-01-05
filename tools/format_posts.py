from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


FENCE_RE = re.compile(r"^(?P<indent>\s*)(?P<ticks>`{3,})(?P<rest>.*)$")
BAD_FENCE_LANG_RE = re.compile(
    r"^(?P<indent>\s*)(?P<ticks>`{3,})\s+(?P<lang>c|cpp|bash|sh|shell|asm|ld|makefile|text)\s*$",
    re.IGNORECASE,
)
BR_LINE_RE = re.compile(r"^\s*<br\s*/?>\s*$", re.IGNORECASE)


@dataclass
class FormatStats:
    removed_br: int = 0
    fixed_fence_lang: int = 0
    demoted_h1: int = 0


def has_front_matter(lines: list[str]) -> bool:
    if not lines or lines[0].strip() != "---":
        return False
    for i in range(1, min(len(lines), 200)):
        if lines[i].strip() == "---":
            return True
    return False


def format_markdown(text: str) -> tuple[str, FormatStats]:
    lines = text.splitlines()
    stats = FormatStats()

    in_code = False
    fence_ticks: str | None = None

    fm = has_front_matter(lines)
    after_front_matter = not fm
    if fm:
        # find end of front matter
        end = 0
        for i in range(1, min(len(lines), 2000)):
            if lines[i].strip() == "---":
                end = i
                break
    else:
        end = -1

    out: list[str] = []

    for idx, line in enumerate(lines):
        if fm and not after_front_matter:
            out.append(line)
            if idx == end:
                after_front_matter = True
            continue

        # Code fence handling
        m = FENCE_RE.match(line)
        if m:
            # Normalize opener language marker like "``` c" -> "```c" (only on opener)
            if not in_code:
                m2 = BAD_FENCE_LANG_RE.match(line)
                if m2:
                    indent = m2.group("indent")
                    ticks = m2.group("ticks")
                    lang = m2.group("lang")
                    out.append(f"{indent}{ticks}{lang.lower()}")
                    stats.fixed_fence_lang += 1
                else:
                    out.append(line)
                in_code = True
                fence_ticks = m.group("ticks")
            else:
                # closing fence
                out.append(line)
                # close only if same ticks length or greater
                ticks = m.group("ticks")
                if fence_ticks is None or len(ticks) >= len(fence_ticks):
                    in_code = False
                    fence_ticks = None
            continue

        if in_code:
            out.append(line)
            continue

        # Remove standalone <br>
        if BR_LINE_RE.match(line):
            stats.removed_br += 1
            continue

        # Demote H1 headings inside post body (Hexo title already exists)
        if line.startswith("# "):
            out.append("## " + line[2:])
            stats.demoted_h1 += 1
            continue

        out.append(line)

    return "\n".join(out) + ("\n" if text.endswith("\n") else ""), stats


def check_fence_balance(text: str) -> bool:
    # only counts fence lines; should be even under typical usage
    fence_lines = [l for l in text.splitlines() if l.strip().startswith("```")]
    return (len(fence_lines) % 2) == 0


def main() -> int:
    posts_dir = Path(__file__).resolve().parents[1] / "source" / "_posts"
    files = sorted(posts_dir.glob("*.md"))

    changed = 0
    total = 0
    total_stats = FormatStats()
    unbalanced: list[str] = []

    for p in files:
        total += 1
        old = p.read_text(encoding="utf-8")
        new, st = format_markdown(old)

        if new != old:
            p.write_text(new, encoding="utf-8")
            changed += 1
            total_stats.removed_br += st.removed_br
            total_stats.fixed_fence_lang += st.fixed_fence_lang
            total_stats.demoted_h1 += st.demoted_h1

        if not check_fence_balance(new):
            unbalanced.append(p.name)

    print(f"posts_total={total} changed={changed}")
    print(
        f"removed_br={total_stats.removed_br} fixed_fence_lang={total_stats.fixed_fence_lang} demoted_h1={total_stats.demoted_h1}"
    )
    if unbalanced:
        print("WARNING: unbalanced_fences:")
        for name in unbalanced:
            print(" -", name)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
