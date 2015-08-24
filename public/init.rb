data = load("fallout.csv")
data.each do |d|
  d["Minutes"] = d["Duration"].split(":").reverse.zip([1,60,60*24]).inject(0) {
    |sum,n| sum + n[0].to_i * n[1]
  }
  d["CapsPerHour"] = (d["Caps"] * 60 / d["Minutes"]).round(2)
end
plot(data,"L","CapsPerHour")
