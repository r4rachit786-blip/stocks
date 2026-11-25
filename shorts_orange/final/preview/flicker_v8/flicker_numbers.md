# v8 flicker test (1440 render -> lanczos 1080)

Shimmer metric: % of pixels whose luma flips >12/255 with alternating sign >=3 times inside any 10-frame window.

## A. Slowed camera (12 % speed, 30 frames at mid-push): motion < ~1 px/frame, so flips = aliasing (moving characters also count)
| clip (beforeS) | frames | shimmer px, whole frame | top third | middle | bottom third |
|---|---|---|---|---|---|
| bazaar | 30 | 1.579 % | 1.673 % | 3.054 % | 0.011 % |
| lisbon | 30 | 0.626 % | 0.251 % | 1.312 % | 0.316 % |
| square | 30 | 0.187 % | 0.089 % | 0.028 % | 0.445 % |
| dutch | 30 | 0.031 % | 0.042 % | 0.049 % | 0.003 % |
| stall | 30 | 0.058 % | 0.091 % | 0.063 % | 0.019 % |
| sail | 30 | 0.161 % | 0.000 % | 0.436 % | 0.047 % |

| clip (afterS) | frames | shimmer px, whole frame | top third | middle | bottom third |
|---|---|---|---|---|---|
| bazaar | 30 | 1.606 % | 1.675 % | 3.131 % | 0.011 % |
| lisbon | 30 | 1.289 % | 0.252 % | 3.445 % | 0.170 % |
| square | 30 | 0.027 % | 0.052 % | 0.019 % | 0.010 % |
| dutch | 30 | 0.030 % | 0.040 % | 0.050 % | 0.000 % |
| stall | 30 | 0.113 % | 0.168 % | 0.087 % | 0.084 % |
| sail | 30 | 0.291 % | 0.000 % | 0.825 % | 0.048 % |

Sail after the lateen fix (plain cloth on the edge-on mizzen):
| clip (after2S) | frames | shimmer px, whole frame | top third | middle | bottom third |
|---|---|---|---|---|---|
| sail | 30 | 0.163 % | 0.000 % | 0.440 % | 0.048 % |

## B. Real-speed push-ins (the review clips here): includes legitimate texture motion, so absolute numbers are high; compare before/after only
| clip (before) | frames | shimmer px, whole frame | top third | middle | bottom third |
|---|---|---|---|---|---|
| bazaar | 45 | 9.677 % | 17.125 % | 9.226 % | 2.679 % |
| lisbon | 48 | 57.753 % | 39.847 % | 34.159 % | 99.255 % |
| square | 90 | 49.528 % | 24.715 % | 24.586 % | 99.283 % |
| dutch | 73 | 21.449 % | 20.691 % | 13.615 % | 30.041 % |
| stall | 90 | 40.841 % | 37.649 % | 21.973 % | 62.902 % |
| sail | 56 | 24.989 % | 19.769 % | 35.529 % | 19.668 % |

| clip (after) | frames | shimmer px, whole frame | top third | middle | bottom third |
|---|---|---|---|---|---|
| bazaar | 45 | 9.913 % | 17.109 % | 9.939 % | 2.689 % |
| lisbon | 48 | 54.165 % | 34.405 % | 33.134 % | 94.956 % |
| square | 90 | 34.659 % | 20.113 % | 12.680 % | 71.183 % |
| dutch | 73 | 19.528 % | 20.648 % | 13.544 % | 24.391 % |
| stall | 90 | 38.561 % | 35.118 % | 18.960 % | 61.604 % |
| sail | 56 | 18.669 % | 15.131 % | 33.766 % | 7.108 % |
