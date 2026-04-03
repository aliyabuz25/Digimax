export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/live',
      permanent: false,
    },
  }
}

export default function Home() {
  return null
}
