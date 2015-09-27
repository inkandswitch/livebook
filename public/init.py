data = load("fallout.csv")
for d in data:
    dparts = map(int, [0,0,0] + d["Duration"].split(":"))
    dparts.reverse()
    d["Dam"] =  sum(map(int,d["Damage"].split("-")))/2.0
    d["Minutes"] =  dparts[0] + dparts[1] * 60 + dparts[2] * 1440
    d["Hours"] = d["Minutes"] / 60
    d["CapsPerHour"] = d["Caps"] /d["Hours"]
plot(data,"L","CapsPerHour")
