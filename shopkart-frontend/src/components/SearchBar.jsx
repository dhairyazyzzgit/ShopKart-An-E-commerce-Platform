export default function SearchBar({ search, setSearch, category, setCategory, sort, setSort }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="input"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="All">All Categories</option>
        <option value="Electronics">Electronics</option>
        <option value="Fashion">Fashion</option>
        <option value="Books">Books</option>
      </select>
      <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="">Sort By</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  );
}
