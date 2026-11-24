# Round 5b: WARP anchors (output frame, story frame) from the new voice (words6.json) onto the round-4 story timeline
# (words_r4.json). Each anchor pairs a new word (line, word, nth) with the old word that drives the same picture event.
import json, re
O=json.load(open("words_r4.json")); N=json.load(open("words6.json")); FPS=30
norm=lambda w: re.sub(r"[^a-z0-9]","",w.lower()).replace("neeeehow","niihau")
def find(D,line,word,nth=1,end=False):
    k=0
    for w in D["words"]:
        if w["line"]==line and norm(w["w"])==norm(word):
            k+=1
            if k==nth: return (w["t"]+(w["d"] if end else 0))*FPS
    raise KeyError((line,word,nth))
ls=lambda D,i: D["lines"][i]["t0"]*FPS
P=[]  # (new, old)
L=lambda n,o: P.append((ls(N,n),ls(O,o)))
W=lambda nl,nw,ol,ow,nn=1,on=1,end=False: P.append((find(N,nl,nw,nn,end),find(O,ol,ow,on,end)))
L(0,0); W(0,"empty",0,"empty"); L(1,1); W(1,"people",1,"people"); L(2,2); W(2,"Niihau",2,"Niihau"); W(2,"submarine",2,"submarine")
L(3,3); W(3,"lands",3,"lands"); P.append((N["lines"][3]["t1"]*FPS+3,319)); P.append((ls(N,4),332)); P.append((find(N,4,"fence"),336));  # the crash plays in the beat before "In a fence"
L(5,5); W(5,"pulls",5,"pulls"); W(5,"pistol",5,"pistol"); W(5,"papers",5,"papers")
L(6,6); W(6,"back",6,"back"); W(6,"luck",6,"luck"); L(7,7); W(7,"war",7,"war"); W(7,"so",8,"so"); W(7,"party",8,"party")
L(8,9); W(8,"radio",9,"radio"); W(8,"news",9,"news"); L(9,10); W(9,"quickly",10,"quickly"); L(10,11); W(10,"prisoner",11,"prisoner"); W(10,"And",12,"And"); W(10,"banned",12,"banned")
L(11,13); W(11,"five",13,"five"); W(11,"shotgun",13,"shotgun"); L(12,14); W(12,"house",14,"house"); W(12,"They",15,"They",2,1); W(12,"plane",15,"plane")
L(13,16); W(13,"caves",16,"caves"); W(13,"One",17,"One"); P.append((find(N,13,"not",end=True),1112))
P.append((ls(N,14),1145)); P.append((find(N,14,"jumps"),1161)); P.append((find(N,14,"pilot",1,end=True),1180)); W(14,"The",19,"The",2,1); W(14,"three",19,"three"); W(14,"times",19,"times",end=True)
L(15,20); W(15,"mad",20,"mad"); P.append((ls(N,16),1336)); W(16,"throws",21,"throws"); W(16,"wall",21,"wall")
L(17,22); W(17,"rock",22,"rock"); L(18,23); W(18,"empty",23,"empty"); W(18,"private",23,"private")
W(18,"one",24,"One"); W(18,"phones",24,"phones"); W(18,"power",24,"power"); W(18,"boat",24,"boat"); W(18,"week",24,"week",end=True)
n19=ls(N,19); P.append((n19-1,1641)); L(19,26); W(19,"medal",26,"medal"); W(19,"The",27,"The",2,1); W(19,"came",27,"came",end=True)
L(20,28); W(20,"museum",28,"museum"); W(20,"souvenir",29,"souvenir"); W(20,"empty",29,"empty",end=True)
TOTAL=round(N["total"]*FPS); STORY=1935
P=[(0,0),(4,4)]+sorted(P)+[(TOTAL,STORY)]
out=[]; 
for n,o in P:
    n=round(n); o=round(o)
    if out and (n<=out[-1][0] or o<=out[-1][1]): print("skip non-monotonic",(n,o),"after",out[-1]); continue
    out.append([n,o])
print("TOTAL",TOTAL); print(json.dumps(out))
for (a,A),(b,B) in zip(out,out[1:]): r=(B-A)/(b-a); 
json.dump({"total":TOTAL,"warp":out},open("warp6.json","w"))
rates=[((B-A)/(b-a),a,b,A,B) for (a,A),(b,B) in zip(out,out[1:])]
for r in sorted(rates)[:4]+sorted(rates)[-6:]: print("rate %.2f new %d-%d story %d-%d"%r)
