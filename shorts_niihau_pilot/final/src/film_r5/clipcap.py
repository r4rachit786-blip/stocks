import re
cuts=[97,176,289,608,656,779,811,886,946,1060,1092,1142,1495,1586,1688,1723,1758]
cuts=[c/30 for c in cuts]
ts=lambda s:(lambda h,m,x:int(h)*3600+int(m)*60+float(x))(*s.split(':'))
fmt=lambda t:"%d:%02d:%05.2f"%(t//3600,(t%3600)//60,t%60)
out=[];n=0
for l in open('captions6.ass'):
    if l.startswith('Dialogue:'):
        p=l.split(',',9); a,b=ts(p[1]),ts(p[2])
        for c in cuts:
            if a<c<b and b-c<=0.4 and c-a>=0.2:
                print(p[9].strip(),p[1],p[2],'->',fmt(c-0.01)); p[2]=fmt(c-0.01); n+=1; break
        l=','.join(p)
    out.append(l)
open('captions7.ass','w').writelines(out); print(n,'clipped')
