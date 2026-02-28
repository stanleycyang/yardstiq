export function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-mono font-bold text-green-terminal">yardstiq</span>
          <span className="text-sm text-zinc-500">
            Built by{" "}
            <a href="https://github.com/stanleycyang" className="text-zinc-400 hover:text-white transition">
              @stanleycyang
            </a>
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <a href="https://github.com/stanleycyang/yardstiq" className="hover:text-zinc-300 transition">
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/yardstiq" className="hover:text-zinc-300 transition">
            npm
          </a>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
}
