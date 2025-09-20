# Visualizer for intervals and chords

A simple app that shows intervals between notes in a scale, or structure of chords within a scale.

* When `chord` is set to `None`, click on two notes to see the interval between them. The interval can be dragged.
* Select a chord to see, where it occurs in the scale. The chord structure can be dragged.
* Switch between circular mode (one octave with overflow) and linear (two octaves).

# Development

Development environment can be reproduced with the Nix package manager by running `nix develop` from the repository root.

```shell
nix develop # installs node, pnpm and VS code
cd circle-of-fifths
code
pnpm dev
```