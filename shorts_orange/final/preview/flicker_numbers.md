# Flicker A/B (v5)

```
slow real camera move (12 % speed), 10 frames, full post chain incl. MSAA + ink; % of region pixels that flicker (alternating >12/255 jumps >= 3x)
souk    rugs/banners + arches (wall band)      before 11.082 %  after 0.040 %
serai   hanging rugs + brick wall              before 0.004 %  after 0.004 %
bazaar  bunting + facades                      before 0.092 %  after 0.096 %
square  bunting + facades + sign               before 0.061 %  after 0.072 %
china   lanterns + strings                     before 0.266 %  after 0.264 %
goa     pennants + rigging                     before 0.028 %  after 0.028 %

whole frame, slow real move:
before:
bazaar  flicker px 0.600 %   mean |frame diff| 4.728
serai   flicker px 1.096 %   mean |frame diff| 3.713
souk    flicker px 3.576 %   mean |frame diff| 4.119
square  flicker px 0.088 %   mean |frame diff| 4.703
china   flicker px 0.100 %   mean |frame diff| 2.383
goa     flicker px 0.028 %   mean |frame diff| 1.179
after:
bazaar  flicker px 0.600 %   mean |frame diff| 4.695
serai   flicker px 1.090 %   mean |frame diff| 3.658
souk    flicker px 0.233 %   mean |frame diff| 2.350
square  flicker px 0.040 %   mean |frame diff| 4.462
china   flicker px 0.099 %   mean |frame diff| 2.366
goa     flicker px 0.026 %   mean |frame diff| 1.148

whole frame, camera locked (after; remaining = animated characters, walking camels):
bazaar  flicker px 0.318 %   mean |frame diff| 2.273
serai   flicker px 1.088 %   mean |frame diff| 2.767
souk    flicker px 0.206 %   mean |frame diff| 0.923
square  flicker px 0.003 %   mean |frame diff| 0.513
china   flicker px 0.084 %   mean |frame diff| 1.056
goa     flicker px 0.009 %   mean |frame diff| 0.190
```
