
import pandas as pd


class Test:
    def test_resample(self):
        print "testing resample..."
        df = pd.DataFrame.from_data({"head":["h1","h2"],"body":{"h1":[1,2,1,1],"h2":[10,30,25,25],"h3":["cow","dog","pig"]},"length":4})
        s1 = df.set_index("h1")["h2"]
        s2 = df.set_index("h2")["h1"]
        print "h1,h2 resample"
        r1 = s1.resample("A")
        assert r1[0] == 20
        assert r1[1] == 30
        print "h2,h1 resample"
        r2 = s2.resample("A",how="count")
        assert r2[0] == 1
        assert r2[1] == 2

    def test_set_index(self):
        print "testing index..."
        df = pd.DataFrame.from_data({"head":["h1","h2"],"body":{"h1":[1,2,3,4],"h2":[40,30,20,10]},"length":4})
        df2 = df.set_index("h1")
        df3 = df.set_index("h2")
        assert df2.h1[0] == 1
        assert df3.h1[0] == 4
        assert df3.h2[0] == 10

    def test_dropna(self):
        print "testing dropna..."
        df = pd.DataFrame.from_data({"head":["h1","h2"],"body":{"h1":[1,2,None,None],"h2":[10,None,30,40]},"length":4})
        df2 = df.dropna(subset=["h1"])
        df3 = df.dropna(subset=["h2"])
        df4 = df.dropna(subset=["h2","h1"])
        assert len(df2) == 2
        assert len(df3) == 3
        assert len(df4) == 1

    def test_dataframe(self):
        print "testing dataframe..."
        df = pd.DataFrame.from_data({"head":["h1","h2"],"body":{"h1":[1,2,3,4],"h2":[10,20,30,40]},"length":4})
        assert type(df[0]) == tuple
        assert type(df["h1"]) == pd.Series
        assert len(df) == 4
        assert df[0] == (1,10)
        assert df.h1[0] == 1
        assert df.h2[2] == 30
        assert df["h1"][1] == 2
        assert df["h2"][1] == 20

def do_test(t,name):
    try:
        getattr(t,name)()
    except Exception as e:
        print e
        print "-- ERROR -- There was an error running test '%s'"%name

def run():
    t = Test()
    print "begin testing"
    do_test(t,"test_dataframe")
    do_test(t,"test_dropna")
    do_test(t,"test_set_index")
    do_test(t,"test_resample")
    print "done"

