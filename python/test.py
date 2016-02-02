
import pandas as pd
import livebook
import copy

class Test:
    def test_deepcopy(self):
        df1 = pd.DataFrame.from_dict({"name":["zak","aaron"],"age":[30,40]}).sort_values("name")
        df2 = copy.deepcopy(df1)
        assert df1._data is df2._data
        assert not df1._columns is df2._columns
        assert not df1._idx is df2._idx
        s1 = df1["name"]
        s2 = copy.deepcopy(s1)
        assert s1.data is s2.data
        assert s1.column is s2.column # is str - imutable
        assert s1.sort is s2.sort # is str - imutable
        assert not s1.idx is s2.idx

    def test_getitem(self):
        df1 = pd.DataFrame.from_dict({"name":["zak","aaron"],"age":[30,40]})
        df2 = df1.set_index("name").sort_values("name")
        assert df1[0] == ("zak",30)
        assert df2[0] == ("aaron",40)
        assert df2.index.tolist() == ["aaron","zak"] ## FIXME - sort and index are different operations

    def test_record(self):
        df = pd.DataFrame.from_dict({"h1":[1,2],"h2":[25,35]})
        for i,r in df.iterrows():
            if i == 0:
                assert r.h1 == 1
                assert r.h2 == 25
            if i == 1:
                assert r.h1 == 2
                assert r.h2 == 35

    def test_resample(self):
        df = pd.DataFrame.from_dict({"h1":[1,2,1,1],"h2":[10,30,25,25],"h3":["monkey","cow","dog","pig"]})
        s1 = df.set_index("h1").sort_values("h1")["h2"]
        s2 = df.set_index("h2").sort_values("h2")["h1"]
        s1i = s1.get_index()
        assert s1i.tolist() == [1,1,1,2]
        r1 = s1.resample("Q")
        assert r1[0] == 20
        assert r1[1] == 30
        r2 = s2.resample("Q",how="count")
        assert r2[0] == 1
        assert r2[1] == 2
        df = pd.DataFrame.from_dict({"date":['2015-01-01','2015-01-02','2015-02-01'],"bolides":[2,6,150]})
        bb = df.set_index("date").sort_values("date")["bolides"]
        s1 = bb.resample("M",how="count")
        s2 = bb.resample("M")
        s3 = bb.resample("A",how="count")
        assert s1.tolist() == [2,1]
        assert s2.tolist() == [4,150]
        assert s3.tolist() == [3]

    def test_set_index(self):
        df = pd.DataFrame.from_dict({"h1":[1,2,3,4],"h2":[40,30,20,10]})
        df2 = df.set_index("h1").sort_values("h1")
        df3 = df.set_index("h2").sort_values("h2")
        assert df2.h1[0] == 1
        assert df3.h1[0] == 4
        assert df3.h2[0] == 10

    def test_dropna(self):
        df = pd.DataFrame.from_dict({"h1":[1,2,None,None],"h2":[10,None,30,40]})
        df2 = df.dropna(subset=["h1"])
        df3 = df.dropna(subset=["h2"])
        df4 = df.dropna(subset=["h2","h1"])
        assert len(df2) == 2
        assert len(df3) == 3
        assert len(df4) == 1

    def test_dataframe(self):
        df = pd.DataFrame.from_dict({"h1":[1,2,3,4],"h2":[10,20,30,40]})
        assert type(df[0]) == tuple
        #assert type(df["h1"]) == pd.Series ## FIXME - this is an instance now with pypy
        assert len(df) == 4
        assert df[0] == (1,10)
        assert df.h1[0] == 1
        assert df.h2[2] == 30
        assert df["h1"][1] == 2
        assert df["h2"][1] == 20

    def test_head_tail(self):
        df = pd.DataFrame.from_dict({"h1":[1,2,3,4,5,6,7,8],"h2":[10,20,30,40,50,60,70,80]})
        assert len(df.head()) == 5
        assert len(df.head(7)) == 7
        assert df.head()["h1"].tolist() == [1,2,3,4,5]
        assert df.head()["h2"].tolist() == [10,20,30,40,50]
        assert df.tail()["h1"].tolist() == [4,5,6,7,8]
        assert df.tail(2)["h2"].tolist() == [70,80]
        assert df["h1"].tail().tolist() == [4,5,6,7,8]
        assert df["h2"].tail(2).tolist() == [70,80]
        assert df.head().columns() == df.columns()

    def test_value_counts(self):
        df = pd.DataFrame.from_dict({"h1":[1,2,3,4,5,6,7,8],"h2":['A','A','B','B','B','C','B','B']})
        assert len(df.h2.value_counts()) == 3
#        assert type(df.h2.value_counts()) == pd.Series ## FIXME pypy makes this an instance now
        assert df.h2.value_counts()[0] == 5
        assert df.h2.value_counts()[1] == 2
        assert df.h2.value_counts()[2] == 1

    def test_series_to_frame(self):
        df1 = pd.DataFrame.from_dict({"h1":[1,2,3],"h2":['A','A','B'],"h3":[300,200,100]})
        df2 = df1.set_index("h3").sort_values("h3")
        s1  = df1["h1"]
        s2  = df2["h1"]
        assert list(s1) == [1,2,3]
        assert s1.tolist() == [1,2,3]
        assert s2.tolist() == [3,2,1]
        df3 = pd.DataFrame(s1)
        df4 = pd.DataFrame(s2)
        assert df3.columns() == ["h1"]
        assert df4.columns() == ["h3","h1"]

    def test_apply(self):
        df1 = pd.DataFrame.from_dict({"h1":[1,2,3],"h2":['A','A','B']})
        df2 = df1.apply(lambda x: x*2)
        assert df2.h1.tolist() == [2,4,6]
        assert df2.h2.tolist() == ["AA","AA","BB"]
        assert df1.h1.apply(lambda x: x*10).tolist() == [10,20,30]

    def test_cmp(self):
        df1 = pd.DataFrame.from_dict({"h1":[1,2,3],"h2":['A','A','B']})
        assert (df1["h1"] == 2).tolist() == [False,True,False]
        assert (df1["h1"] >= 2).tolist() == [False,True,True]
        assert (df1["h1"] >  2).tolist() == [False,False,True]
        assert (df1["h1"] <> 2).tolist() == [True,False,True]
        assert (df1["h1"] <  2).tolist() == [True,False,False]
        assert (df1["h1"] <= 2).tolist() == [True,True,False]
        assert df1[ df1["h1"] <= 2].h1.tolist() == [1,2]

    def test_iloc(self):
        data = pd.DataFrame.from_dict({"ones":[1,1,1,1,1],"people":[1,2,3,4,5],"profit":[100,200,300,200,100]})
        cols = data.shape[1]
        len(data.iloc[:]) == len(data)
        len(data.iloc[1:]) == len(data) - 1
        len(data.iloc[:2]) == 3
        len(data.iloc[:,0:cols-1]) == len(data)
        data.iloc[:,0:cols-1].columns() == ["ones","people"]
        data.iloc[:,cols-1:cols].columns() == ["profit"]

    def test_setitem(self):
        data = pd.DataFrame.from_dict({"ones":[1,1,1,1,1],"people":[1,2,3,4,5],"profit":[500,400,300,200,100]})
        d1 = data.set_index("profit").sort_values("profit")
        d2 = data.set_index("profit")
        d1["new"] = d1.index
        d2["new"] = d2.index
        assert d1.index.tolist() == [100,200,300,400,500] # FIXME setindex does not sort
        assert d1.new.tolist() == [100,200,300,400,500]
        assert d1.people.tolist() == [5,4,3,2,1]
        assert d2.index.tolist() == [500,400,300,200,100]
        assert d2.new.tolist() == [500,400,300,200,100]
        assert d2.people.tolist() == [1,2,3,4,5]

    def test_unique(self):
        s1 = pd.Series([1,1,2,3,3,3,3,3,3,4,99])
        assert s1.unique().tolist() == [1,2,3,4,99]

    def test_set_and(self):
        data = pd.DataFrame.from_dict({"ones":[1,1,1,1,1],"people":[1,2,3,4,5],"profit":[500,400,300,200,100]})
        assert len(data[(data["people"] < 5) & (data["profit"] <= 300)]) == 2

    def test_describe(self):
        data = pd.DataFrame.from_dict({"ones":[1,1,1,1,1],"people":[1,2,3,4,5],"profit":[500,400,300,200,100]})
        desc = data.describe()
        print "describe needs a test!"

    def test_livebook_do(self):
        (val,err,local) = livebook.do("import string\n"
                                      "string.capwords('fun ' * 3)\n",1)
        assert val == "Fun Fun Fun"

        (val,err,local) = livebook.do("x = 1234",2)
        assert val == None
        assert local["x"] == 1234

        (val,err,local) = livebook.do("x",3)
        assert val == 1234

        (val,err,local) = livebook.do("impo",4)
        assert val == None
        assert err["under_construction"] == 1

        (val,err,local) = livebook.do("impox",4)
        assert val == None
        assert err["under_construction"] == None

def do_test(t,name):
    try:
        print "running: %s" % name
        getattr(t,name)()
    except Exception as e:
        print e
        print "-- ERROR -- There was an error running test '%s'"%name

def run():
    t = Test()
    print "begin testing"
    do_test(t,"test_dataframe")
    do_test(t,"test_head_tail")
    do_test(t,"test_dropna")
    do_test(t,"test_set_index")
    do_test(t,"test_unique")
    do_test(t,"test_resample")
    do_test(t,"test_getitem")
    do_test(t,"test_record")
    do_test(t,"test_value_counts")
    do_test(t,"test_series_to_frame")
    do_test(t,"test_apply")
    do_test(t,"test_cmp")
    do_test(t,"test_iloc")
    do_test(t,"test_setitem")
    do_test(t,"test_set_and")
    do_test(t,"test_describe")
    do_test(t,"test_deepcopy")
    do_test(t,"test_livebook_do")
    print "done"

