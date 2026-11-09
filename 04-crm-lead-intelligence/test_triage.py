import unittest
from triage import analyze_bytes, MAX_BYTES

HEADER = "company,role,openings,agency,email,opt_out\n"


class LeadTriageTests(unittest.TestCase):
    def test_scoring_and_rejections(self):
        csv_data = HEADER + (
            "Acme Metals,Security Engineer,3,no,hiring@acme.example,no\n"
            "Staffing Co,Developer,9,yes,hi@staff.example,no\n"
            "Acme Metals,Analyst,1,no,other@acme.example,no\n"
            "Quiet Co,Designer,2,no,hi@quiet.example,yes\n")
        result = analyze_bytes(csv_data.encode())
        self.assertFalse(result["auto_send"])
        self.assertEqual(len(result["leads"]), 1)
        self.assertEqual(result["leads"][0]["score"], 45)
        self.assertEqual(len(result["rejected"]), 3)

    def test_company_opt_out_suppresses_earlier_and_later_rows(self):
        rows = [
            "Acme,Engineer,5,no,a@acme.example,no",
            "Acme,Engineer,1,no,b@acme.example,yes",
            "Acme,Engineer,9,no,c@acme.example,no",
        ]
        for ordering in (rows, list(reversed(rows))):
            result = analyze_bytes((HEADER + "\n".join(ordering) + "\n").encode())
            self.assertEqual(result["leads"], [])
            self.assertTrue(any(r["reason"] == "opted out" for r in result["rejected"]))

    def test_malformed_opt_out_still_suppresses_company(self):
        csv_data = HEADER + (
            "Acme,Engineer,4,no,valid@acme.example,no\n"
            "Acme,,bad,no,INVALID,yes\n"
            "Acme,Engineer,8,no,other@acme.example,no\n")
        result = analyze_bytes(csv_data.encode())
        self.assertFalse(result["leads"])
        self.assertIn("opted out", [entry["reason"] for entry in result["rejected"]])

    def test_agency_conflict_suppresses_company(self):
        csv_data = HEADER + (
            "Agency Co,Developer,3,no,one@agency.example,no\n"
            "Agency Co,Developer,1,yes,two@agency.example,no\n"
        )
        result = analyze_bytes(csv_data.encode())
        self.assertEqual(result["leads"], [])

    def test_invalid_email_is_not_treated_as_verified(self):
        result = analyze_bytes((HEADER + "Acme,Engineer,1,no,invalid,no\n").encode())
        self.assertFalse(result["leads"])
        self.assertIn("syntax", result["rejected"][0]["reason"])

    def test_nfkc_expansion_cannot_bypass_field_limit(self):
        # U+FB03 expands from one code point to three ASCII letters.
        value = "\ufb03" * 60
        result = analyze_bytes((HEADER + f"{value},Engineer,1,no,a@acme.example,no\n").encode())
        self.assertFalse(result["leads"])
        self.assertIn("oversized", result["rejected"][0]["reason"])

    def test_formula_prefix_is_rejected(self):
        value = HEADER + "=CMD(),Analyst,1,no,test@demo.example,no\n"
        self.assertFalse(analyze_bytes(value.encode())["leads"])

    def test_unknown_header_fails_closed(self):
        with self.assertRaises(ValueError):
            analyze_bytes(b"company,role,agency\n")

    def test_oversize_fails_early(self):
        with self.assertRaisesRegex(ValueError, "1 MB"):
            analyze_bytes(b" " * (MAX_BYTES + 1))

    def test_malformed_and_numeric_negative(self):
        result = analyze_bytes((HEADER + 'Acme,Engineer,-2,no,a@a.example,no\n').encode())
        self.assertEqual(result["rejected"][0]["reason"], "openings out of range")
        with self.assertRaises(ValueError):
            analyze_bytes((HEADER + '"unclosed,Engineer,2,no,a@a.example,no\n').encode())


if __name__ == "__main__":
    unittest.main()
