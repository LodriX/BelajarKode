import Icon from '../components/Icon.jsx';

export default function NotFound() {
  return (
    <div className="screen">
      <div className="empty-state">
        <span className="empty-icon">
          <Icon name="alert" size={22} />
        </span>
        <h3>Halaman tidak ditemukan</h3>
        <p>Rute ini tidak ada atau materi sudah berubah.</p>
        <a className="btn btn-accent" href="#/">
          Kembali ke Beranda <Icon name="arrowRight" size={15} />
        </a>
      </div>
    </div>
  );
}
