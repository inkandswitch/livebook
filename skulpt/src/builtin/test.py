
import pandas as pd



def test_dropna():
    print "testing dropna..."
    df = pd.DataFrame({"head":["h1","h2"],"body":{"h1":[1,2,None,None],"h2":[10,None,30,40]},"length":4})
    df2 = df.dropna(subset=["h1"])
    df3 = df.dropna(subset=["h2"])
    df4 = df.dropna(subset=["h2","h1"])
    assert df2.length == 2
    assert df3.length == 3
    assert df4.length == 1

def test_dataframe():
    print "testing dataframe...!"
    df = pd.DataFrame({"head":["h1","h2"],"body":{"h1":[1,2,3,4],"h2":[10,20,30,40]},"length":4})
    assert df.length == 4
    assert df[0] == (1,10)
    assert df.h1[0] == 1
    assert df.h1[1] == 2
    assert df["h1"][0] == 1
    assert df["h2"][1] == 20

def run():
    print "begin testing"
    test_dataframe()
    test_dropna()
    print "done"

