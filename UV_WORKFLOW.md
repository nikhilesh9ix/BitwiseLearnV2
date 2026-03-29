# UV Workflow (No venv activation)

This project is configured to use `uv` directly, without creating or activating a local virtual environment.

## Prerequisites

- Install `uv`:
  - Windows (winget): `winget install Astral-sh.uv`

- Verify:
  - `uv --version`

## 1) Run monolith backend

```bash
uv run --no-project --with-requirements apps/python-server/requirements.txt --directory apps/python-server uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 2) Run microservices (all)

```powershell
.\run-services.ps1
```

The launcher uses `uv run` with each service's `requirements.txt` and editable `apps/shared` automatically.

## 3) Run tests

```bash
uv run --no-project --with-requirements apps/python-server/requirements.txt --with-requirements apps/python-server/requirements-test.txt --directory apps/python-server pytest
```

Run a single test file:

```bash
uv run --no-project --with-requirements apps/python-server/requirements.txt --with-requirements apps/python-server/requirements-test.txt --directory apps/python-server pytest tests/path/to/test_file.py -q
```

## 4) Seed superadmin

```bash
uv run --no-project --with-requirements apps/python-server/requirements.txt seed_superadmin.py
```

Required env vars:

- `DATABASE_URL`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`

Optional:

- `SUPERADMIN_NAME`

## 5) Install extra package for one-off local run

```bash
uv run --with rich python -c "import rich; print(rich.__version__)"
```

## 6) Notes

- No `Activate.ps1` step is required.
- No `.venv` folder is required.
- Python version is pinned via `.python-version`.
