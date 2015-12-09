from os.path import join, dirname
import cffi

ffi = cffi.FFI()
ffi.cdef('''
/* from randomkit.h */
//#define RK_STATE_LEN 624

typedef struct rk_state_
{
    unsigned long key[624];
    int pos;
    int has_gauss; /* !=0: gauss contains a gaussian deviate */
    double gauss;

    /* The rk_state structure has been extended to store the following
     * information for the binomial generator. If the input values of n or p
     * are different than nsave and psave, then the other parameters will be
     * recomputed. RTK 2005-09-02 */

    int has_binomial; /* !=0: following parameters initialized for
                              binomial */
    double psave;
    long nsave;
    double r;
    double q;
    double fm;
    long m;
    double p1;
    double xm;
    double xl;
    double xr;
    double c;
    double laml;
    double lamr;
    double p2;
    double p3;
    double p4;

}
rk_state;

typedef enum {
    RK_NOERR = 0, /* no error */
    RK_ENODEV = 1, /* no RK_DEV_RANDOM device */
    RK_ERR_MAX = 2
} rk_error;

/* error strings */
extern char *rk_strerror[2]; //RK_ERR_MAX

/* Maximum generated random value */
//#define RK_MAX 0xFFFFFFFFUL

/*
 * Initialize the RNG state using the given seed.
 */
void rk_seed(unsigned long seed, rk_state *state);
/*
 * Initialize the RNG state using a random seed.
 * Uses /dev/random or, when unavailable, the clock (see randomkit.c).
 * Returns RK_NOERR when no errors occurs.
 * Returns RK_ENODEV when the use of RK_DEV_RANDOM failed (for example because
 * there is no such device). In this case, the RNG was initialized using the
 * clock.
 */
extern rk_error rk_randomseed(rk_state *state);

/*
 * Returns a random unsigned long between 0 and RK_MAX inclusive
 */
extern unsigned long rk_random(rk_state *state);

/*
 * Returns a random long between 0 and LONG_MAX inclusive
 */
extern long rk_long(rk_state *state);

/*
 * Returns a random unsigned long between 0 and ULONG_MAX inclusive
 */
extern unsigned long rk_ulong(rk_state *state);

/*
 * Returns a random unsigned long between 0 and max inclusive.
 */
extern unsigned long rk_interval(unsigned long max, rk_state *state);

/*
 * Returns a random double between 0.0 and 1.0, 1.0 excluded.
 */
extern double rk_double(rk_state *state);

/*
 * fill the buffer with size random bytes
 */
extern void rk_fill(void *buffer, size_t size, rk_state *state);

/*
 * fill the buffer with randombytes from the random device
 * Returns RK_ENODEV if the device is unavailable, or RK_NOERR if it is
 * On Unix, if strong is defined, RK_DEV_RANDOM is used. If not, RK_DEV_URANDOM
 * is used instead. This parameter has no effect on Windows.
 * Warning: on most unixes RK_DEV_RANDOM will wait for enough entropy to answer
 * which can take a very long time on quiet systems.
 */
extern rk_error rk_devfill(void *buffer, size_t size, int strong);

/*
 * fill the buffer using rk_devfill if the random device is available and using
 * rk_fill if is is not
 * parameters have the same meaning as rk_fill and rk_devfill
 * Returns RK_ENODEV if the device is unavailable, or RK_NOERR if it is
 */
extern rk_error rk_altfill(void *buffer, size_t size, int strong,
                            rk_state *state);

/*
 * return a random gaussian deviate with variance unity and zero mean.
 */
extern double rk_gauss(rk_state *state);

/* end of randomkit.h */

/* from initarray.h */
extern void
init_by_array(rk_state *self, unsigned long * init_key,
              intptr_t key_length);

/* from distributions.h */
/* Copyright 2005 Robert Kern (robert.kern@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* References:
 *
 * Devroye, Luc. _Non-Uniform Random Variate Generation_.
 *  Springer-Verlag, New York, 1986.
 *  http://cgm.cs.mcgill.ca/~luc/rnbookindex.html
 *
 * Kachitvichyanukul, V. and Schmeiser, B. W. Binomial Random Variate
 *  Generation. Communications of the ACM, 31, 2 (February, 1988) 216.
 *
 * Hoermann, W. The Transformed Rejection Method for Generating Poisson Random
 *  Variables. Insurance: Mathematics and Economics, (to appear)
 *  http://citeseer.csail.mit.edu/151115.html
 *
 * Marsaglia, G. and Tsang, W. W. A Simple Method for Generating Gamma
 * Variables. ACM Transactions on Mathematical Software, Vol. 26, No. 3,
 * September 2000, Pages 363-372.
 */

/* Normal distribution with mean=loc and standard deviation=scale. */
extern double rk_normal(rk_state *state, double loc, double scale);

/* Standard exponential distribution (mean=1) computed by inversion of the
 * CDF. */
extern double rk_standard_exponential(rk_state *state);

/* Exponential distribution with mean=scale. */
extern double rk_exponential(rk_state *state, double scale);

/* Uniform distribution on interval [loc, loc+scale). */
extern double rk_uniform(rk_state *state, double loc, double scale);

/* Standard gamma distribution with shape parameter.
 * When shape < 1, the algorithm given by (Devroye p. 304) is used.
 * When shape == 1, a Exponential variate is generated.
 * When shape > 1, the small and fast method of (Marsaglia and Tsang 2000)
 * is used.
 */
extern double rk_standard_gamma(rk_state *state, double shape);

/* Gamma distribution with shape and scale. */
extern double rk_gamma(rk_state *state, double shape, double scale);

/* Beta distribution computed by combining two gamma variates (Devroye p. 432).
 */
extern double rk_beta(rk_state *state, double a, double b);

/* Chi^2 distribution computed by transforming a gamma variate (it being a
 * special case Gamma(df/2, 2)). */
extern double rk_chisquare(rk_state *state, double df);

/* Noncentral Chi^2 distribution computed by modifying a Chi^2 variate. */
extern double rk_noncentral_chisquare(rk_state *state, double df, double nonc);

/* F distribution computed by taking the ratio of two Chi^2 variates. */
extern double rk_f(rk_state *state, double dfnum, double dfden);

/* Noncentral F distribution computed by taking the ratio of a noncentral Chi^2
 * and a Chi^2 variate. */
extern double rk_noncentral_f(rk_state *state, double dfnum, double dfden, double nonc);

/* Binomial distribution with n Bernoulli trials with success probability p.
 * When n*p <= 30, the "Second waiting time method" given by (Devroye p. 525) is
 * used. Otherwise, the BTPE algorithm of (Kachitvichyanukul and Schmeiser 1988)
 * is used. */
extern long rk_binomial(rk_state *state, long n, double p);

/* Binomial distribution using BTPE. */
extern long rk_binomial_btpe(rk_state *state, long n, double p);

/* Binomial distribution using inversion and chop-down */
extern long rk_binomial_inversion(rk_state *state, long n, double p);

/* Negative binomial distribution computed by generating a Gamma(n, (1-p)/p)
 * variate Y and returning a Poisson(Y) variate (Devroye p. 543). */
extern long rk_negative_binomial(rk_state *state, double n, double p);

/* Poisson distribution with mean=lam.
 * When lam < 10, a basic algorithm using repeated multiplications of uniform
 * variates is used (Devroye p. 504).
 * When lam >= 10, algorithm PTRS from (Hoermann 1992) is used.
 */
extern long rk_poisson(rk_state *state, double lam);

/* Poisson distribution computed by repeated multiplication of uniform variates.
 */
extern long rk_poisson_mult(rk_state *state, double lam);

/* Poisson distribution computer by the PTRS algorithm. */
extern long rk_poisson_ptrs(rk_state *state, double lam);

/* Standard Cauchy distribution computed by dividing standard gaussians
 * (Devroye p. 451). */
extern double rk_standard_cauchy(rk_state *state);

/* Standard t-distribution with df degrees of freedom (Devroye p. 445 as
 * corrected in the Errata). */
extern double rk_standard_t(rk_state *state, double df);

/* von Mises circular distribution with center mu and shape kappa on [-pi,pi]
 * (Devroye p. 476 as corrected in the Errata). */
extern double rk_vonmises(rk_state *state, double mu, double kappa);

/* Pareto distribution via inversion (Devroye p. 262) */
extern double rk_pareto(rk_state *state, double a);

/* Weibull distribution via inversion (Devroye p. 262) */
extern double rk_weibull(rk_state *state, double a);

/* Power distribution via inversion (Devroye p. 262) */
extern double rk_power(rk_state *state, double a);

/* Laplace distribution */
extern double rk_laplace(rk_state *state, double loc, double scale);

/* Gumbel distribution */
extern double rk_gumbel(rk_state *state, double loc, double scale);

/* Logistic distribution */
extern double rk_logistic(rk_state *state, double loc, double scale);

/* Log-normal distribution */
extern double rk_lognormal(rk_state *state, double mean, double sigma);

/* Rayleigh distribution */
extern double rk_rayleigh(rk_state *state, double mode);

/* Wald distribution */
extern double rk_wald(rk_state *state, double mean, double scale);

/* Zipf distribution */
extern long rk_zipf(rk_state *state, double a);

/* Geometric distribution */
extern long rk_geometric(rk_state *state, double p);
extern long rk_geometric_search(rk_state *state, double p);
extern long rk_geometric_inversion(rk_state *state, double p);

/* Hypergeometric distribution */
extern long rk_hypergeometric(rk_state *state, long good, long bad, long sample);
extern long rk_hypergeometric_hyp(rk_state *state, long good, long bad, long sample);
extern long rk_hypergeometric_hrua(rk_state *state, long good, long bad, long sample);

/* Triangular distribution */
extern double rk_triangular(rk_state *state, double left, double mode, double right);

/* Logarithmic series distribution */
extern long rk_logseries(rk_state *state, double p);
''')

ffi.set_source(
    "numpy.random._mtrand",
    """
#include "mtrand/initarray.h"
#include "mtrand/randomkit.h"
#include "mtrand/distributions.h"
""")
