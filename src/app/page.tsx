'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);

  const fileId = searchParams.get('fileId');

  useEffect(() => {
    if (!fileId) return;

    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

    fetch(url)
      .then(res => res.text())
      .then(text => {
        setData(text);
      })
      .catch(err => {
        console.error(err);
      });
  }, [fileId]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Relatório</h1>

      {!fileId && <p>Informe o fileId na URL.</p>}
      {fileId && !data && <p>Carregando dados...</p>}
      {data && <pre>{data}</pre>}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Carregando página...</p>}>
      <PageContent />
    </Suspense>
  );
}
