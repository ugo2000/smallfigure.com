from PIL import Image
import numpy as np
BG=(14,22,46)
cats=["oldfolk","imp","flybeast","oddplants","jewels"]
rows=[]
for cat in cats:
    ims=[]
    for i in range(1,7):
        p=f"processed/{cat}-{i}.png"
        im=Image.open(p).convert("RGBA"); a=np.array(im)
        al=a[...,3]
        op=(al>200).sum()/al.size*100; semi=((al>30)&(al<=200)).sum()/al.size*100
        print(f"{cat}-{i}: opaque={op:.1f}% semi={semi:.1f}%")
        bg=Image.new("RGB",im.size,BG); bg.paste(im,(0,0),im); ims.append(bg.resize((300,300)))
    row=Image.new("RGB",(1800,300),BG)
    for k,im in enumerate(ims): row.paste(im,(k*300,0))
    rows.append(row)
sheet=Image.new("RGB",(1800,1500),BG)
for k,row in enumerate(rows): sheet.paste(row,(0,k*300))
sheet.save("tools/_batch_sheet.png")
print("sheet ok")
