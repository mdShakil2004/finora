import asyncio
from backend.scripts.seed import run_seed

if __name__ == "__main__":
    asyncio.run(run_seed())
