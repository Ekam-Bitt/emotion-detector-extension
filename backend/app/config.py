import os


class AppConfig:
    def __init__(self, model_path: str, top_k: int, torch_num_threads: int):
        self.model_path = model_path
        self.top_k = top_k
        self.torch_num_threads = torch_num_threads

    @staticmethod
    def from_env() -> "AppConfig":
        return AppConfig(
            model_path=os.getenv("MODEL_ID", "ekam28/emotion-detector"),
            top_k=int(os.getenv("TOP_K", "7")),
            torch_num_threads=int(os.getenv("TORCH_NUM_THREADS", "1")),
        )

    def to_flask_config(self) -> dict:
        return {
            "MODEL_PATH": self.model_path,
            "TOP_K": self.top_k,
            "TORCH_NUM_THREADS": self.torch_num_threads,
        }
