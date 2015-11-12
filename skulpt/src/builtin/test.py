
import pandas as pd


class Test:
    def test_select(self):
        print "testing select..."
        df = pd.DataFrame.from_data({"head":["h1","h2"],"body":{"h1":[1,2,1,1],"h2":[25,25,25,30],"h3":["cow","cow","pig","cow"]},"length":4})
        df2 = df.select("h1",1)
        assert len(df2) == 3
        df3 = df2.select("h2",25)
        assert len(df3) == 2
        df4 = df3.select("h3","cow")
        assert len(df4) == 1
        assert len(df4.h1) == 1
        assert df4.h1[0] == 1
        assert df4.h2[0] == 25
        assert df4.h3[0] == "cow"

    def test_resample(self):
        print "testing resample..."
        df = pd.DataFrame.from_data({"head":["h1","h2"],"body":{"h1":[1,2,1,1],"h2":[10,30,25,25],"h3":["monkey","cow","dog","pig"]},"length":4})
        s1 = df.set_index("h1")["h2"]
        s2 = df.set_index("h2")["h1"]
        r1 = s1.resample("A")
        assert r1[0] == 20
        assert r1[1] == 30
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
    do_test(t,"test_select")
    print "done"

