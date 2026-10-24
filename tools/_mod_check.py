from PIL import Image
import numpy as np
BG=(14,22,46)
ims=[]
for i in range(1,7):
    p=f"processed/mod-{i}.png"
    im=Image.open(p).convert("RGBA"); a=np.array(im)
    al=a[...,3]
    op=(al>200).sum(); semi=((al>30)&(al<=200)).sum()
    tot=al.size
    print(f"mod-{i}: size={im.size} opaque={op/tot*100:.1f}% semi={semi/tot*100:.1f}%")
    bg=Image.new("RGB",im.size,BG); bg.paste(im,(0,0),im); ims.append(bg.resize((300,300)))
sheet=Image.new("RGB",(900,600),(14,22,46))
for k,im in enumerate(ims): sheet.paste(im,((k%3)*300,(k//3)*300))
sheet.save("tools/_mod_sheet.png")
print("sheet ok")
