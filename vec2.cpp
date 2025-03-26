#include <iostream>
#include <vector>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <algorithm>

const double INF = 1e100;
const double EPS = 1e-9;
const double PI = acos(-1.0L);

bool is_zero(double x)
{
    return fabs(x) < EPS;
}

bool eq(double x, double y)
{
    return is_zero(x - y);
}

/// @brief `x < y: -1`
///
/// `x == y: 0`
///
// `x > y:  1`
int compare(double x, double y)
{
    if (fabs(x - y) < EPS)
        return 0;
    return (x < y) ? -1 : +1;
}

/// @brief `< 0: -1`
///
/// `== 0: 0`
///
// `> 0:  1`
int sign(double x)
{
    return compare(x, 0.0);
}

struct vec2
{
    double x, y;

    static bool equal(const vec2 &u, const vec2 &v)
    {
        return eq(u.x, v.x) && eq(u.y, v.y);
    }

    static vec2 from_points(const vec2 &p1, const vec2 &p2)
    {
        return p2 - p1;
    }

    static double dot(const vec2 &v, const vec2 &u)
    {
        return v.x * u.x + v.y * u.y;
    }

    /// @brief Signed area of the parallelogram defined by v and u.
    ///
    ///`> 0`: counterclockwise
    ///
    /// `< 0`: clockwise
    ///
    /// `== 0`: collinear
    static double cross(const vec2 &v, const vec2 &u)
    {
        return (v.x * u.y) - (v.y * u.x);
    }

    static double signed_parallelogram_area(const vec2 &p1, const vec2 &p2, const vec2 &p3)
    {
        return cross(vec2::from_points(p1, p2), vec2::from_points(p2, p3));
    }

    static double signed_triangle_area(const vec2 &p1, const vec2 &p2, const vec2 &p3)
    {
        return signed_parallelogram_area(p1, p2, p3) / 2.0;
    }

    static double triangle_area(const vec2 &p1, const vec2 &p2, const vec2 &p3)
    {
        return fabs(triangle_area(p1, p2, p3));
    }

    /// @brief `1`: counterclockwise
    ///
    /// `-1`: clockwise
    ///
    /// `0`: collinear
    static int ccw(const vec2 &p1, const vec2 &p2, const vec2 &p3)
    {
        return sign(vec2::cross(vec2::from_points(p1, p2), vec2::from_points(p1, p3)));
    }

    static bool are_collinear(const vec2 &p1, const vec2 &p2, const vec2 &p3)
    {
        return ccw(p1, p2, p3) == 0;
    }

    static double dist(const vec2 &p1, const vec2 &p2)
    {
        return (p2 - p1).norm();
    }

    static double squared_dist(const vec2 &p1, const vec2 &p2)
    {
        return vec2::from_points(p1, p2).squared_norm();
    }

    /// @brief Returns the distance from `p` to the line defined by `a` and `b`,
    /// and stores the closest point in `c`.
    static double dist_line(const vec2 &p, const vec2 &a, const vec2 &b, vec2 &c)
    {
        vec2 ap = vec2::from_points(a, p);
        vec2 ab = vec2::from_points(a, b);
        double u = vec2::dot(ap, ab) / ab.squared_norm();
        c = a + ab * u;
        return vec2::dist(p, c);
    }

    /// @brief Returns the distance from `p` to the line defined by `a` and `b`,
    /// and stores the closest point in `c`.
    static double dist_segment(const vec2 &p, const vec2 &a, const vec2 &b, vec2 &c)
    {
        vec2 ap = vec2::from_points(a, p);
        vec2 ab = vec2::from_points(a, b);
        double u = vec2::dot(ap, ab) / ab.squared_norm();
        if (u < 0.0)
        {
            c = a.copy();
            return vec2::dist(a, p);
        }
        else if (u > 1.0)
        {
            c = b.copy();
            return vec2::dist(b, p);
        }
        c = a + ab * u;
        return vec2::dist(p, c);
    }

    static double angle_normalized(const vec2 &u, const vec2 &v)
    {
        return std::acos(vec2::dot(u, v));
    }

    static double angle(const vec2 &u, const vec2 &v)
    {
        return angle_normalized(u.normalized(), v.normalized());
    }

    static double angle(const vec2 &a, const vec2 &o, const vec2 &b)
    {
        return angle(a - o, b - o);
    }

    /// @brief 0: on, 1: outside, -1: inside.
    static int inside_circle(const vec2 &p, const vec2 &c, const double r)
    {
        double sq_len = vec2::from_points(c, p).squared_norm();
        double sq_r = r * r;
        if (std::fabs(sq_len - sq_r) < EPS)
        {
            return 0;
        }
        else if (sq_len > sq_r)
        {
            return 1;
        }
        else
        {
            return -1;
        }
    }

    /// @brief Return whether it is possible to obtain a circle that contains the
    /// two points and has the given radius. If it is possible, assign the center
    /// of one such circle to `c`. To get the other center, swap `p1` and `p2`.
    static bool circle_center(const vec2 &p1, const vec2 &p2, double r, vec2 &c)
    {
        double d2 = squared_dist(p1, p2);
        double det = r * r / d2 - 0.25;
        if (det < EPS)
        {
            return false;
        }
        else
        {
            double h = std::sqrt(det);
            c.x = (p1.x + p2.x) * 0.5 + (p1.y - p2.y) * h;
            c.y = (p1.y + p2.y) * 0.5 + (p2.x - p1.x) * h;
            return true;
        }
    }

    vec2() : x(0), y(0)
    {
    }

    vec2(double x, double y) : x(x), y(y) {}

    vec2(const vec2 &v) : x(v.x), y(v.y) {}

    vec2 copy() const
    {
        return vec2(x, y);
    }

    bool operator<(const vec2 &p) const
    {
        return x < p.x || (x == p.x && y < p.y);
    }

    vec2 operator-() const
    {
        return vec2(-x, -y);
    }

    vec2 &operator=(const vec2 &v)
    {
        x = v.x;
        y = v.y;
        return *this;
    }

    vec2 operator+(const vec2 &v) const
    {
        return vec2(x + v.x, y + v.y);
    }

    vec2 operator-(const vec2 &v) const
    {
        return vec2(x - v.x, y - v.y);
    }

    vec2 &operator+=(const vec2 &v)
    {
        x += v.x;
        y += v.y;
        return *this;
    }

    vec2 &operator-=(const vec2 &v)
    {
        x -= v.x;
        y -= v.y;
        return *this;
    }

    vec2 operator+(double s) const
    {
        return vec2(x + s, y + s);
    }

    vec2 operator-(double s) const
    {
        return vec2(x - s, y - s);
    }

    vec2 operator*(double s) const
    {
        return vec2(x * s, y * s);
    }

    vec2 operator/(double s) const
    {
        return vec2(x / s, y / s);
    }

    vec2 &operator+=(double s)
    {
        x += s;
        y += s;
        return *this;
    }

    vec2 &operator-=(double s)
    {
        x -= s;
        y -= s;
        return *this;
    }

    vec2 &operator*=(double s)
    {
        x *= s;
        y *= s;
        return *this;
    }

    vec2 &operator/=(double s)
    {
        x /= s;
        y /= s;
        return *this;
    }

    void set(double x, double y)
    {
        this->x = x;
        this->y = y;
    }

    vec2 projected_into(const vec2 &v)
    {
        return v * (vec2::dot(*this, v) / v.squared_norm());
    }

    vec2 &rotate(double radians)
    {
        double c = cos(radians);
        double s = sin(radians);
        double tx = x * c - y * s;
        double ty = x * s + y * c;
        x = tx;
        y = ty;
        return *this;
    }

    vec2 rotated(double radians)
    {
        return copy().rotate(radians);
    }

    double squared_norm() const
    {
        return vec2::dot(*this, *this);
    }

    double norm() const
    {
        return std::sqrt(squared_norm());
    }

    vec2 &normalize()
    {
        double l = norm();
        if (l == 0)
        {
            return *this;
        }
        *this *= (1.0 / l);
        return *this;
    }

    vec2 normalized() const
    {
        return copy().normalize();
    }

    vec2 ortho() const
    {
        return vec2(y, -x);
    }
};

struct line
{
    // represents ax + by + c = 0
    // (a, b) is the normal vector of the line
    double a, b, c;

    line() : a(0.0), b(0.0), c(0.0) {}

    line(double a_, double b_, double c_) : a(a_), b(b_), c(c_) {}

    static line from_points(const vec2 &p1, const vec2 &p2)
    {
        line l;
        if (fabs(p1.x - p2.x) < EPS)
        {
            l.a = 1.0;
            l.b = 0.0;
            l.c = -p1.x;
        }
        else
        {
            l.a = -(double)(p1.y - p2.y) / (p1.x - p2.x);
            l.b = 1.0;
            l.c = -(l.a * p1.x) - p1.y;
        }
        return l;
    }

    static line from_point_slope(const vec2 &p, double m)
    {
        line l;
        l.a = -m;
        l.b = 1.0;
        l.c = -((l.a * p.x) + (l.b * p.y));
        return l;
    }

    static bool are_parallel(const line &l1, const line &l2)
    {
        return (fabs(l1.a - l2.a) < EPS) && (fabs(l1.b - l2.b) < EPS);
    }

    static bool are_equal(const line &l1, const line &l2)
    {
        return are_parallel(l1, l2) && (fabs(l1.c - l2.c) < EPS);
    }

    static bool do_intersect(const line &l1, const line &l2, vec2 &p)
    {
        if (are_parallel(l1, l2))
        {
            return false;
        }

        p.x = (l2.b * l1.c - l1.b * l2.c) / (l2.a * l1.b - l1.a * l2.b);

        if (fabs(l1.b) > EPS) // test for vertical line
            p.y = -(l1.a * p.x + l1.c);
        else
            p.y = -(l2.a * p.x + l2.c);
        return true;
    }

    line copy()
    {
        return line(a, b, c);
    }

    line &translate(vec2 d)
    {
        c -= a * d.x + b * d.y;
        return *this;
    }

    line translated(vec2 d)
    {
        return copy().translate(d);
    }

    /// @brief Return the number of intersections between the line and the circle
    /// centered at the origin. The two points are the intersections.
    int circle_intersect(double r, vec2 &p1, vec2 &p2)
    {
        double x0 = -a * c / (a * a + b * b);
        double y0 = -b * c / (a * a + b * b);
        if (c * c > r * r * (a * a + b * b) + EPS)
        {
            return 0;
        }
        else if (fabs(c * c - r * r * (a * a + b * b)) < EPS)
        {
            p1.x = x0;
            p1.y = y0;
            return 1;
        }
        else
        {
            double d = r * r - c * c / (a * a + b * b);
            double mult = sqrt(d / (a * a + b * b));
            double ax, ay, bx, by;
            ax = x0 + b * mult;
            bx = x0 - b * mult;
            ay = y0 - a * mult;
            by = y0 + a * mult;
            p1.x = ax;
            p1.y = ay;
            p2.x = bx;
            p2.y = by;
            return 2;
        }
    }

    /// @brief Return the number of intersections between the line and the circle.
    /// The two points are the intersections.
    int circle_intersect(double r, const vec2 &center, vec2 &p1, vec2 &p2)
    {
        int n = translated(-center).circle_intersect(r, p1, p2);
        p1 += center;
        p2 += center;
        return n;
    }

    vec2 normal()
    {
        return vec2(a, b);
    }
};

/// @brief Return the number of intersections between the two circles,
/// where the first has its center at the origin. The two points are
/// the intersections. Returns -1 if there are infinitely many intersections.
int two_circle_intersect(double r1, double r2, const vec2 &c2, vec2 &p1, vec2 &p2)
{
    if (is_zero(c2.x) && is_zero(c2.y))
    {
        if (eq(r1, r2))
        {
            return -1;
        }
        else
        {
            return 0;
        }
    }
    line l(-2.0 * c2.x, -2.0 * c2.y, c2.squared_norm() + r1 * r1 - r2 * r2);
    return l.circle_intersect(r2, p1, p2);
}

/// @brief Return the number of intersections between the two circles.
/// The two points are the intersections.
int two_circle_intersect(double r1, const vec2 &c1, double r2, const vec2 &c2, vec2 &p1, vec2 &p2)
{
    vec2 new_c2 = c2 - c1;
    int n = two_circle_intersect(r1, r2, new_c2, p1, p2);
    p1 += c1;
    p2 += c1;
    return n;
}

double simple_poly_area(const std::vector<vec2> &poly)
{
    double area = 0.0;
    for (unsigned i = 0; i < poly.size(); i++)
    {
        const vec2 &p = i ? poly[i - 1] : poly.back();
        const vec2 &q = poly[i];
        area += (p.x - q.x) * (p.y + q.y);
    }
    return fabs(area) / 2.0;
}

/// @brief On: `0`
///
/// In: `-1`
///
/// Out: `1`
int point_in_simple_poly(const std::vector<vec2> &poly, const vec2 &p)
{
    int n = (int)poly.size();
    int w = 0;
    for (int i = 0; i < n; i++)
    {
        const vec2 &a = poly[i];
        if (vec2::equal(p, a))
        {
            // the point is on a vertex
            return 0;
        }
        else
        {
            int j = (i + 1) % n;
            const vec2 &b = poly[j];
            if (eq(p.y, a.y) && eq(p.y, b.y))
            {
                // the segment is horizontal
                if ((compare(std::min(a.x, b.x), p.x) == -1) && (compare(p.x, std::max(a.x, b.x)) == -1))
                {
                    // the point is on the segment
                    return 0;
                }
            }
            else
            {
                // the segment is not horizontal
                bool a_below = a.y < p.y;
                bool b_below = b.y < p.y;
                if (a_below != b_below)
                {
                    // the segment is below and above the point
                    int orientation = vec2::ccw(a, b, p);
                    if (orientation == 0)
                    {
                        // the point is on the segment
                        return 0;
                    }
                    else
                    {
                        if (a_below == (orientation == 1))
                        {
                            // the point is before the segment, so the ray intersects
                            // the segment
                            if (a_below)
                            {
                                w++;
                            }
                            else
                            {
                                w--;
                            }
                        }
                    }
                }
            }
        }
    }
    if (w == 0)
    {
        return 1;
    }
    else
    {
        return -1;
    }
}

std::vector<vec2> convex_hull(std::vector<vec2> ps)
{
    int n = ps.size();
    int k = 0;
    if (n <= 3)
    {
        return ps;
    }
    std::vector<vec2> hull(2 * n);

    // Sort points lexicographically
    std::sort(ps.begin(), ps.end());

    // Build lower hull
    for (int i = 0; i < n; ++i)
    {
        // if you want all the points that lie on the convex hull, not just
        // some set of the points that make up the convex hull, replace <= 0
        // with == -1 here and in the upper hull building
        while (k >= 2 && vec2::ccw(hull[k - 2], hull[k - 1], ps[i]) <= 0)
        {
            k--;
        }
        hull[k] = ps[i];
        k++;
    }

    // Build upper hull
    // ps[n-1] is in the hull already
    for (int i = n - 2, t = k + 1; i >= 0; --i)
    {
        while (k >= t && vec2::ccw(hull[k - 2], hull[k - 1], ps[i]) <= 0)
        {
            k--;
        }
        hull[k] = ps[i];
        k++;
    }

    hull.resize(k - 1);
    return hull;
}

int main()
{
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr), std::cout.tie(nullptr);
    // std::cout << std::fixed << std::setprecision(4);
}
