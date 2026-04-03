import Head from 'next/head'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import useAuth from '../hooks/useAuth'

interface Inputs {
  email: string
  password: string
}

function Login() {
  const [login, setLogin] = useState(false)
  const { signIn, signUp } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()

  const onSubmit: SubmitHandler<Inputs> = async ({ email, password }) => {
    if (login) {
      await signIn(email, password)
      return
    }

    await signUp(email, password)
  }

  return (
    <>
      <Head>
        <title>Canlı TV Giriş</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-[#040404] text-white">
        <div className="absolute inset-0">
          <img
            src="/login_background.jpg"
            alt=""
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45),rgba(0,0,0,0.88))]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-6 sm:px-6 lg:px-10">
          <div className="flex items-center">
            <img
              src="/main-logo.png"
              className="h-10 w-auto object-contain sm:h-12"
              alt="main logo"
            />
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="grid w-full max-w-6xl overflow-hidden border border-[#222] bg-[#111] shadow-[0_20px_60px_rgba(0,0,0,0.45)] lg:grid-cols-[1.05fr_0.95fr]">
              <section className="hidden border-r border-[#222] p-10 lg:flex lg:flex-col lg:justify-between">
                <div>
                  <h1 className="max-w-lg text-6xl font-semibold leading-[0.95] tracking-tight text-white">
                    Canlı yayımı daha rahat və təmiz izləyin.
                  </h1>
                  <p className="mt-6 max-w-xl text-base leading-7 text-white/60">
                    Türkiyə və Azərbaycan kanalları üçün daha rahat, daha aydın
                    və daha səliqəli bir izləmə təcrübəsi.
                  </p>
                </div>
              </section>

              <section className="p-6 sm:p-8 lg:p-10">
                <div className="mx-auto max-w-md">
                  <h2 className="text-4xl font-semibold tracking-tight text-white">
                    {login ? 'Daxil ol' : 'Qeydiyyatdan keç'}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    {login
                      ? 'Mövcud hesabınızla daxil olun və yayımı davam etdirin.'
                      : 'Yeni hesab yaradın və platformanı dərhal istifadə edin.'}
                  </p>

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-10 space-y-5"
                  >
                    <label className="block">
                      <span className="mb-2 block text-sm text-white/65">E-poçt</span>
                      <input
                        type="email"
                        placeholder="mail@example.com"
                        className="input"
                        {...register('email', { required: true })}
                      />
                      {errors.email ? (
                        <p className="px-1 pt-2 text-sm text-orange-400">
                          Zəhmət olmasa düzgün e-poçt daxil edin.
                        </p>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-white/65">Şifrə</span>
                      <input
                        type="password"
                        placeholder="Şifrənizi daxil edin"
                        className="input"
                        {...register('password', { required: true })}
                      />
                      {errors.password ? (
                        <p className="px-1 pt-2 text-sm text-orange-400">
                          Şifrə 4 ilə 60 simvol arasında olmalıdır.
                        </p>
                      ) : null}
                    </label>

                    <button
                      type="submit"
                      className="w-full bg-[#e50914] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#ff1a25]"
                      onClick={() => setLogin(true)}
                    >
                      Daxil ol
                    </button>

                    <button
                      type="submit"
                      className="w-full border border-[#333] bg-[#1b1b1b] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#232323]"
                      onClick={() => setLogin(false)}
                    >
                      Qeydiyyatdan keç
                    </button>
                  </form>

                  <div className="mt-6 border border-[#222] bg-[#181818] p-4 text-sm text-white/50">
                    Hesab məlumatları cihaz daxilində saxlanılır. Daxil olduqdan
                    sonra birbaşa canlı TV bölməsinə keçəcəksiniz.
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
