# Homebrew formula for design-ai.
#
# Install via tap:
#   brew tap sungjin/design-ai https://github.com/sungjin/design-ai.git
#   brew install design-ai
#
# Or directly from this URL:
#   brew install sungjin/design-ai/design-ai
#
# Submitting to homebrew-core requires a stable release with downloadable
# tarballs and a maintained URL. This formula targets the GitHub release
# tarball pattern: https://github.com/sungjin/design-ai/archive/refs/tags/v3.4.0.tar.gz

class DesignAi < Formula
  desc "Senior product designer for any AI coding agent (Claude Code, Codex, Cursor, Aider)"
  homepage "https://github.com/sungjin/design-ai"
  url "https://github.com/sungjin/design-ai/archive/refs/tags/v3.4.0.tar.gz"
  sha256 "REPLACE_WITH_ACTUAL_TARBALL_SHA256_AFTER_RELEASE"
  license "MIT"
  version "3.4.0"

  depends_on "node" => :recommended  # for the npm CLI; not strictly required for symlink-only install

  def install
    # Install the corpus to libexec — that's our package's "home"
    libexec.install Dir["*"]

    # Wrapper script that invokes install.sh from the right path
    (bin/"design-ai-install").write <<~EOS
      #!/bin/bash
      exec "#{libexec}/install.sh" "$@"
    EOS

    # If Node is available, also expose the npm CLI's design-ai binary
    if Formula["node"].any_version_installed?
      cd libexec do
        system "npm", "install", "--production", "--silent"
      end
      bin.install_symlink libexec/"cli/bin/design-ai.mjs" => "design-ai"
    else
      # Without Node: design-ai-install is the only entry; symlinks the corpus
      # into ~/.claude/ via install.sh
      opoo "Node.js not installed. Only the install.sh wrapper is available."
      opoo "Install Node and re-link to get the full design-ai CLI:"
      opoo "  brew install node && brew link --overwrite design-ai"
    end
  end

  def caveats
    <<~EOS
      design-ai installed at:
        #{libexec}

      To set up Claude Code skills/agents/commands:
        design-ai install            (with Node)
        design-ai-install            (without Node)

      Other agents (Codex CLI, Cursor, Aider) read from #{libexec} directly.
      See:
        #{libexec}/docs/QUICKSTART.md
        #{libexec}/docs/integrations/

      For SDK adoption, point your code at:
        #{libexec}/AGENTS.md
        #{libexec}/skills/<name>/PLAYBOOK.md
        #{libexec}/knowledge/

      Public docs site: https://sungjin9288.github.io/design-ai/
    EOS
  end

  test do
    # Verify the install.sh wrapper exists and is executable
    assert_predicate libexec/"install.sh", :executable?
    # Verify core corpus files
    assert_predicate libexec/"AGENTS.md", :exist?
    assert_predicate libexec/"knowledge/PRINCIPLES.md", :exist?
    assert_predicate libexec/".claude-plugin/plugin.json", :exist?
    # Verify skill count via plugin.json
    plugin = JSON.parse((libexec/".claude-plugin/plugin.json").read)
    assert_equal "design-ai", plugin["name"]
    assert plugin["skills"].size >= 19
    assert plugin["commands"].size >= 15
    assert plugin["agents"].size >= 4

    # Test CLI help (only if Node is available)
    if Formula["node"].any_version_installed?
      assert_match "design-ai", shell_output("#{bin}/design-ai help")
      assert_match "v3.4.0", shell_output("#{bin}/design-ai version")
    end
  end
end
