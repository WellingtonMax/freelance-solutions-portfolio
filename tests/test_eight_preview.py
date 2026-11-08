"""Offline tests for the eight-project preview builder; no network needed."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / 'tools' / 'build_eight_preview.py'
spec = importlib.util.spec_from_file_location('eight_preview', MODULE)
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class PreviewTests(unittest.TestCase):
    def test_manifest_eight_unique_real_paths(self):
        self.assertEqual([x[0] for x in preview.PROJECTS], [f'{n:02}' for n in range(1, 9)])
        paths = []
        for number, title, pr, entry, files in preview.PROJECTS:
            self.assertIn(entry, files + ('06-document-factory/quotation.html',))
            self.assertGreater(pr, 0)
            for file in files:
                self.assertFalse(Path(file).is_absolute())
                self.assertNotIn('..', Path(file).parts)
                paths.append(file)
        self.assertEqual(len(paths), len(set(paths)))

    def test_hub_has_eight_links_and_honest_disclosure(self):
        sha = {x[2]: 'a' * 40 for x in preview.PROJECTS}
        content = preview.render_index(sha)
        self.assertEqual(content.count('class="action"'), 8)
        self.assertIn('unmerged', content)
        self.assertIn('fictional data', content)
        self.assertIn('127.0.0.1', content)
        self.assertNotIn('<script', content)
        for _, title, _, entry, _ in preview.PROJECTS:
            self.assertIn(title, content)
            self.assertIn(f'href="{entry}"', content)

    def test_build_local_fixture_and_refuse_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            out = root / 'preview-eight'
            def read(ref, path):
                if path.endswith('.html'):
                    return b'<!doctype html><title>Fixture</title>'
                return b'fictional test fixture'
            def generate_quote(folder):
                (folder / 'quotation.html').write_text('<!doctype html><title>Sample quotation</title>', encoding='utf-8')
            sources = preview.assemble(root, out, reader=read, generate_quote=generate_quote)
            self.assertEqual(len(sources), 8)
            self.assertTrue((out / 'index.html').exists())
            for *_, entry, _ in preview.PROJECTS:
                self.assertTrue((out / entry).is_file(), entry)
            with self.assertRaises(FileExistsError):
                preview.assemble(root, out, reader=read, generate_quote=generate_quote)


if __name__ == '__main__':
    unittest.main()
