"""Regenerate the three coherent, seamless texture maps: python make_textures.py"""
from pathlib import Path
import numpy as np
from PIL import Image

size = 512
x, y = np.meshgrid(np.arange(size), np.arange(size))
# Integer numbers of periods ensure seams match under GL_REPEAT.
phase_x = 2 * np.pi * 8 * x / size
phase_y = 2 * np.pi * 8 * y / size
# Embossed blue ceramic with fine golden inlaid grid and wavy height.
wave = np.sin(phase_x) * np.sin(phase_y)
groove_x = np.cos(phase_x) ** 20
groove_y = np.cos(phase_y) ** 20
groove = np.maximum(groove_x, groove_y)
height = 0.48 + 0.10 * wave - 0.09 * groove + 0.018 * np.cos(phase_x + phase_y)

# Diffuse: varied blue ceramic and gold seams.
blue = np.stack([37 + 20 * wave, 120 + 27 * wave, 179 + 32 * wave], axis=-1)
gold = np.array([213, 162, 69], dtype=float)
blend = (groove * 0.82)[..., None]
diffuse = blue * (1 - blend) + gold * blend

# Specular: tiles have stronger highlights, engraved lines are rough/dull.
spec = np.clip(211 + 18 * wave - 164 * groove, 12, 255)
specular = np.stack([spec, spec * 0.93, spec * 0.78], axis=-1)

# Central differences are periodic, matching repeat sampling at image edges.
dhdx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) / 2
dhdy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) / 2
strength = 5.5
normal = np.stack([-strength * dhdx, strength * dhdy, np.ones_like(height)], axis=-1)
normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
normal = (normal * 0.5 + 0.5) * 255

output = Path(__file__).resolve().parent / 'textures'
output.mkdir(exist_ok=True)
for name, pixels in [('diffuse', diffuse), ('specular', specular), ('normal', normal)]:
    Image.fromarray(np.uint8(np.clip(pixels, 0, 255)), 'RGB').save(output / (name + '.png'))
print('Created diffuse.png, specular.png and normal.png')
