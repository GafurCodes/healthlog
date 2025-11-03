export function Footer() {
  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "2rem",
        backgroundColor: "#f5f5f5",
        textAlign: "center",
        color: "#666",
      }}
    >
      <p>&copy; {new Date().getFullYear()} Nibble. All rights reserved.</p>
    </footer>
  );
}
