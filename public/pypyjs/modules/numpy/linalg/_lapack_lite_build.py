import cffi

macros = {'sfx': '_', 'pfx': ''}

LAPACK_DEFS = ('''
/*
 *                    LAPACK functions
 */

typedef struct {{ float r, i; }} f2c_complex;
typedef struct {{ double r, i; }} f2c_doublecomplex;
/* typedef long int (*L_fp)(); */

extern int
{pfx}sgeev{sfx}(char *jobvl, char *jobvr, int *n,
             float a[], int *lda, float wr[], float wi[],
             float vl[], int *ldvl, float vr[], int *ldvr,
             float work[], int lwork[],
             int *info);
extern int
{pfx}dgeev{sfx}(char *jobvl, char *jobvr, int *n,
             double a[], int *lda, double wr[], double wi[],
             double vl[], int *ldvl, double vr[], int *ldvr,
             double work[], int lwork[],
             int *info);
extern int
{pfx}cgeev{sfx}(char *jobvl, char *jobvr, int *n,
             f2c_doublecomplex a[], int *lda,
             f2c_doublecomplex w[],
             f2c_doublecomplex vl[], int *ldvl,
             f2c_doublecomplex vr[], int *ldvr,
             f2c_doublecomplex work[], int *lwork,
             double rwork[],
             int *info);
extern int
{pfx}zgeev{sfx}(char *jobvl, char *jobvr, int *n,
             f2c_doublecomplex a[], int *lda,
             f2c_doublecomplex w[],
             f2c_doublecomplex vl[], int *ldvl,
             f2c_doublecomplex vr[], int *ldvr,
             f2c_doublecomplex work[], int *lwork,
             double rwork[],
             int *info);

extern int
{pfx}ssyevd{sfx}(char *jobz, char *uplo, int *n,
              float a[], int *lda, float w[], float work[],
              int *lwork, int iwork[], int *liwork,
              int *info);
extern int
{pfx}dsyevd{sfx}(char *jobz, char *uplo, int *n,
              double a[], int *lda, double w[], double work[],
              int *lwork, int iwork[], int *liwork,
              int *info);
extern int
{pfx}cheevd{sfx}(char *jobz, char *uplo, int *n,
              f2c_complex a[], int *lda,
              float w[], f2c_complex work[],
              int *lwork, float rwork[], int *lrwork, int iwork[],
              int *liwork,
              int *info);
extern int
{pfx}zheevd{sfx}(char *jobz, char *uplo, int *n,
              f2c_doublecomplex a[], int *lda,
              double w[], f2c_doublecomplex work[],
              int *lwork, double rwork[], int *lrwork, int iwork[],
              int *liwork,
              int *info);

extern int
{pfx}dgelsd{sfx}(int *m, int *n, int *nrhs,
              double a[], int *lda, double b[], int *ldb,
              double s[], double *rcond, int *rank,
              double work[], int *lwork, int iwork[],
              int *info);
extern int
{pfx}zgelsd{sfx}(int *m, int *n, int *nrhs,
              f2c_doublecomplex a[], int *lda,
              f2c_doublecomplex b[], int *ldb,
              double s[], double *rcond, int *rank,
              f2c_doublecomplex work[], int *lwork,
              double rwork[], int iwork[],
              int *info);

extern int
{pfx}sgesv{sfx}(int *n, int *nrhs,
             float a[], int *lda,
             int ipiv[],
             float b[], int *ldb,
             int *info);
extern int
{pfx}dgesv{sfx}(int *n, int *nrhs,
             double a[], int *lda,
             int ipiv[],
             double b[], int *ldb,
             int *info);
extern int
{pfx}cgesv{sfx}(int *n, int *nrhs,
             f2c_complex a[], int *lda,
             int ipiv[],
             f2c_complex b[], int *ldb,
             int *info);
extern int
{pfx}zgesv{sfx}(int *n, int *nrhs,
             f2c_doublecomplex a[], int *lda,
             int ipiv[],
             f2c_doublecomplex b[], int *ldb,
             int *info);

extern int
{pfx}sgetrf{sfx}(int *m, int *n,
              float a[], int *lda,
              int ipiv[],
              int *info);
extern int
{pfx}dgetrf{sfx}(int *m, int *n,
              double a[], int *lda,
              int ipiv[],
              int *info);
extern int
{pfx}cgetrf{sfx}(int *m, int *n,
              f2c_complex a[], int *lda,
              int ipiv[],
              int *info);
extern int
{pfx}zgetrf{sfx}(int *m, int *n,
              f2c_doublecomplex a[], int *lda,
              int ipiv[],
              int *info);

extern int
{pfx}spotrf{sfx}(char *uplo, int *n,
              float a[], int *lda,
              int *info);
extern int
{pfx}dpotrf{sfx}(char *uplo, int *n,
              double a[], int *lda,
              int *info);
extern int
{pfx}cpotrf{sfx}(char *uplo, int *n,
              f2c_complex a[], int *lda,
              int *info);
extern int
{pfx}zpotrf{sfx}(char *uplo, int *n,
              f2c_doublecomplex a[], int *lda,
              int *info);

extern int
{pfx}sgesdd{sfx}(char *jobz, int *m, int *n,
              float a[], int *lda, float s[], float u[],
              int *ldu, float vt[], int *ldvt, float work[],
              int *lwork, int iwork[], int *info);
extern int
{pfx}dgesdd{sfx}(char *jobz, int *m, int *n,
              double a[], int *lda, double s[], double u[],
              int *ldu, double vt[], int *ldvt, double work[],
              int *lwork, int iwork[], int *info);
extern int
{pfx}cgesdd{sfx}(char *jobz, int *m, int *n,
              f2c_complex a[], int *lda,
              float s[], f2c_complex u[], int *ldu,
              f2c_complex vt[], int *ldvt,
              f2c_complex work[], int *lwork,
              float rwork[], int iwork[], int *info);
extern int
{pfx}zgesdd{sfx}(char *jobz, int *m, int *n,
              f2c_doublecomplex a[], int *lda,
              double s[], f2c_doublecomplex u[], int *ldu,
              f2c_doublecomplex vt[], int *ldvt,
              f2c_doublecomplex work[], int *lwork,
              double rwork[], int iwork[], int *info);

extern int
{pfx}spotrs{sfx}(char *uplo, int *n, int *nrhs,
              float a[], int *lda,
              float b[], int *ldb,
              int *info);
extern int
{pfx}dpotrs{sfx}(char *uplo, int *n, int *nrhs,
              double a[], int *lda,
              double b[], int *ldb,
              int *info);
extern int
{pfx}cpotrs{sfx}(char *uplo, int *n, int *nrhs,
              f2c_complex a[], int *lda,
              f2c_complex b[], int *ldb,
              int *info);
extern int
{pfx}zpotrs{sfx}(char *uplo, int *n, int *nrhs,
              f2c_doublecomplex a[], int *lda,
              f2c_doublecomplex b[], int *ldb,
              int *info);

extern int
{pfx}spotri{sfx}(char *uplo, int *n,
              float a[], int *lda,
              int *info);
extern int
{pfx}dpotri{sfx}(char *uplo, int *n,
              double a[], int *lda,
              int *info);
extern int
{pfx}cpotri{sfx}(char *uplo, int *n,
              f2c_complex a[], int *lda,
              int *info);
extern int
{pfx}zpotri{sfx}(char *uplo, int *n,
              f2c_doublecomplex a[], int *lda,
              int *info);

extern int
{pfx}scopy{sfx}(int *n,
             float *sx, int *incx,
             float *sy, int *incy);
extern int
{pfx}dcopy{sfx}(int *n,
             double *sx, int *incx,
             double *sy, int *incy);
extern int
{pfx}ccopy{sfx}(int *n,
             f2c_complex *sx, int *incx,
             f2c_complex *sy, int *incy);
extern int
{pfx}zcopy{sfx}(int *n,
             f2c_doublecomplex *sx, int *incx,
             f2c_doublecomplex *sy, int *incy);

extern double
{pfx}sdot{sfx}(int *n,
            float *sx, int *incx,
            float *sy, int *incy);
extern double
{pfx}ddot{sfx}(int *n,
            double *sx, int *incx,
            double *sy, int *incy);
extern void
{pfx}cdotu{sfx}(f2c_complex *, int *,
       f2c_complex *, int *,
       f2c_complex *, int *);
extern void
{pfx}zdotu{sfx}(f2c_doublecomplex * ret_val, int *n,
	f2c_doublecomplex *zx, int *incx,
    f2c_doublecomplex *zy, int *incy);
extern void
{pfx}cdotc{sfx}(f2c_complex *, int *,
       f2c_complex *, int *,
       f2c_complex *, int *);
extern void
{pfx}zdotc{sfx}(f2c_doublecomplex * ret_val, int *n,
	f2c_doublecomplex *zx, int *incx,
    f2c_doublecomplex *zy, int *incy);

extern int
{pfx}sgemm{sfx}(char *transa, char *transb,
             int *m, int *n, int *k,
             float *alpha,
             float *a, int *lda,
             float *b, int *ldb,
             float *beta,
             float *c, int *ldc);
extern int
{pfx}dgemm{sfx}(char *transa, char *transb,
             int *m, int *n, int *k,
             double *alpha,
             double *a, int *lda,
             double *b, int *ldb,
             double *beta,
             double *c, int *ldc);
extern int
{pfx}cgemm{sfx}(char *transa, char *transb,
             int *m, int *n, int *k,
             f2c_complex *alpha,
             f2c_complex *a, int *lda,
             f2c_complex *b, int *ldb,
             f2c_complex *beta,
             f2c_complex *c, int *ldc);
extern int
{pfx}zgemm{sfx}(char *transa, char *transb,
             int *m, int *n, int *k,
             f2c_doublecomplex *alpha,
             f2c_doublecomplex *a, int *lda,
             f2c_doublecomplex *b, int *ldb,
             f2c_doublecomplex *beta,
             f2c_doublecomplex *c, int *ldc);

extern int
{pfx}dgeqrf{sfx}(int *, int *, double *, int *, double *,
	    double *, int *, int *);

extern int
{pfx}zgeqrf{sfx}(int *, int *, f2c_doublecomplex *, int *,
         f2c_doublecomplex *, f2c_doublecomplex *, int *, int *);

extern int
{pfx}dorgqr{sfx}(int *m, int *n, int *k, double a[], int *lda,
                          double tau[], double work[],
                          int *lwork, int *info);

extern int
{pfx}zungqr{sfx}(int *m, int *n, int *k, f2c_doublecomplex a[],
                          int *lda, f2c_doublecomplex tau[],
                          f2c_doublecomplex work[], int *lwork, int *info);

'''.format(**macros))


ffi = cffi.FFI()
ffi.cdef(LAPACK_DEFS)
ffi.set_source("numpy.linalg._lapack_lite", LAPACK_DEFS)
