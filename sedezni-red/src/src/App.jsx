import React, { useEffect, useState } from 'react'
import { auth, db } from './firebase'
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut
} from 'firebase/auth'
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore'

const TEACHER_EMAIL = import.meta.env.VITE_TEACHER_EMAIL || 'nestl.skitek@gost.bic-lj.si'

export default function App(){
  const [emailInput, setEmailInput] = useState('')
  const [user, setUser] = useState(null)
  const [tests, setTests] = useState([])
  const [selectedTestId, setSelectedTestId] = useState(null)
  const [grid, setGrid] = useState([])
  const [reservations, setReservations] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [newTest, setNewTest] = useState({title:'Test', rows:5, cols:6, dateISO:''})

  useEffect(()=>{
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)){
      const stored = window.localStorage.getItem('emailForSignIn')
      if (stored){
        signInWithEmailLink(auth, stored, window.location.href).then(res=>{
          setUser(res.user)
          window.localStorage.removeItem('emailForSignIn')
          window.history.replaceState({}, document.title, window.location.pathname)
        }).catch(()=>{})
      }
    }
    const unsub = auth.onAuthStateChanged(u=> setUser(u))
    return ()=> unsub()
  },[])

  useEffect(()=>{
    const q = collection(db, 'tests')
    const unsub = onSnapshot(q, snap=>{
      const arr = []
      snap.forEach(d=> arr.push({id:d.id, ...d.data()}))
      arr.sort((a,b)=> (a.dateISO||'') > (b.dateISO||'') ? 1 : -1)
      setTests(arr)
      if (!selectedTestId && arr.length) setSelectedTestId(arr[0].id)
    })
    return ()=>unsub()
  },[selectedTestId])

  useEffect(()=>{
    if (!selectedTestId) return
    // load test metadata
    getDoc(doc(db,'tests', selectedTestId)).then(snap=>{
      if (!snap.exists()) return
      const data = snap.data()
      const rows = data.rows || 5
      const cols = data.cols || 6
      setGrid(Array.from({length:rows}).map(()=> Array.from({length:cols}).map(()=>null)))
    })
    const q = query(collection(db,'reservations'), where('testId','==',selectedTestId))
    const unsub = onSnapshot(q, snap=>{
      const arr = []
      snap.forEach(d=> arr.push({id:d.id, ...d.data()}))
      setReservations(arr)
    })
    return ()=>unsub()
  },[selectedTestId])

  useEffect(()=>{
    if (!grid.length) return
    const g = grid.map(r=> r.map(()=>null))
    reservations.forEach(r=>{
      if (r.row!=null && r.col!=null && r.row < g.length && r.col < g[0].length) g[r.row][r.col]= r
    })
    setGrid(g)
  },[reservations])

  async function sendLink(e){
    e.preventDefault()
    if (!emailInput) return
    try{
      await sendSignInLinkToEmail(auth, emailInput, {url:window.location.href, handleCodeInApp:true})
      window.localStorage.setItem('emailForSignIn', emailInput)
      alert('Poslano: preverite e-pošto in kliknite povezavo za prijavo.')
      setEmailInput('')
    }catch(err){ alert('Napaka: '+ err.message) }
  }

  async function logout(){ await signOut(auth); setUser(null) }

  async function reserve(row,col){
    if (!user){ alert('Prijavite se s svojim e-mailom.'); return }
    // check if user already has a reservation
    const mine = reservations.find(r=> r.email === user.email)
    if (mine){ alert('Sicer imate že rezerviran stol ('+ mine.row+','+mine.col +'). Najprej prekličite.'); return }
    const exists = reservations.find(r=> r.row===row && r.col===col)
    if (exists){ alert('Ta stol je že rezerviran.'); return }
    try{
      await addDoc(collection(db,'reservations'), { testId:selectedTestId, row, col, email:user.email, uid:user.uid, createdAt:serverTimestamp() })
    }catch(err){ alert('Napaka: '+ err.message) }
  }

  async function cancel(id){
    const r = reservations.find(x=> x.id===id)
    if (!r) return
    if (!user || r.email !== user.email){ alert('Rezervacijo lahko prekličete samo lastnik.'); return }
    await deleteDoc(doc(db,'reservations', id))
  }

  async function createTest(e){
    e.preventDefault()
    if (!user || user.email !== TEACHER_EMAIL){ alert('Samo učitelj (admin) lahko ustvari test.'); return }
    if (!newTest.dateISO) { alert('Vnesite datum.'); return }
    try{
      await addDoc(collection(db,'tests'), { ...newTest, rows: Number(newTest.rows), cols: Number(newTest.cols), createdAt: serverTimestamp() })
      setNewTest({title:'Test', rows:5, cols:6, dateISO:''})
      alert('Test ustvarjen')
    }catch(err){ alert('Napaka: '+ err.message) }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Sedežni red</h1>
        <div>
          {user ? (
            <div>
              <div style={{fontSize:12}}>Prijavljen: <b>{user.email}</b></div>
              <div style={{marginTop:8}}>
                <button className="button btn-primary" onClick={()=>setIsAdmin(!isAdmin)}>{isAdmin? 'Poglej kot učenec' : 'Admin način'}</button>
                <button className="button" style={{marginLeft:8}} onClick={logout}>Odjava</button>
              </div>
            </div>
          ) : (
            <form onSubmit={sendLink} style={{display:'flex', gap:8}}>
              <input placeholder="Vaš e-mail" value={emailInput} onChange={e=>setEmailInput(e.target.value)} />
              <button className="button btn-primary" type="submit">Pošlji povezavo</button>
            </form>
          )}
        </div>
      </div>

      <section style={{marginTop:20}}>
        <h3>Razpoložljivi testi</h3>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
          {tests.map(t=> (
            <button key={t.id} onClick={()=> setSelectedTestId(t.id)} className="button" style={{background: selectedTestId===t.id? '#2563eb':'#e5e7eb', color: selectedTestId===t.id? '#fff':'#000'}}>
              {t.title} {t.dateISO? `(${new Date(t.dateISO).toLocaleString()})`: ''}
            </button>
          ))}
        </div>
      </section>

      {isAdmin ? (
        <section style={{marginTop:20}}>
          <h3>Admin: Ustvari test</h3>
          <form onSubmit={createTest} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8}}>
            <input value={newTest.title} onChange={e=> setNewTest(s=>({...s, title:e.target.value}))} placeholder="Naslov testa" />
            <input value={newTest.dateISO} onChange={e=> setNewTest(s=>({...s, dateISO:e.target.value}))} placeholder="YYYY-MM-DDTHH:MM" />
            <input value={newTest.rows} onChange={e=> setNewTest(s=>({...s, rows:e.target.value}))} placeholder="# vrstic" />
            <input value={newTest.cols} onChange={e=> setNewTest(s=>({...s, cols:e.target.value}))} placeholder="# stolpcev" />
            <div style={{gridColumn:'1 / -1'}}>
              <button className="button btn-primary">Ustvari test</button>
            </div>
          </form>

          <div style={{marginTop:16}}>
            <h4>Seznam rezervacij (izbran test)</h4>
            {reservations.length===0? <div>Ni rezervacij.</div> : (
              <table style={{width:'100%', marginTop:8}}>
                <thead><tr><th>Email</th><th>Stol</th><th>Akcija</th></tr></thead>
                <tbody>
                  {reservations.map(r=> (
                    <tr key={r.id}><td>{r.email}</td><td>{r.row},{r.col}</td><td><button className="button btn-danger" onClick={()=> deleteDoc(doc(db,'reservations', r.id))}>Izbriši</button></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      ) : (
        <section style={{marginTop:20}}>
          <h3>Izberi stol</h3>
          <div style={{marginTop:12}}>
            {!grid.length? <div>Izberi test ali počakaj, da se naloži.</div> : (
              <div>
                {grid.map((row, rIdx)=> (
                  <div key={rIdx} className="grid-row">
                    {row.map((cell,cIdx)=> (
                      <div key={cIdx} className={`seat`} style={{background: cell? (cell.email===user?.email? '#10b981':'#ef4444'):'#e5e7eb'}}>
                        {cell? (
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:12}}>{rIdx},{cIdx}</div>
                            {cell.email===user?.email? <button onClick={()=> cancel(cell.id)} style={{fontSize:11, textDecoration:'underline', background:'transparent', border:'none', cursor:'pointer'}}>Prekliči</button>: <div style={{fontSize:11}}>Zasedeno</div>}
                          </div>
                        ) : (
                          <button onClick={()=> reserve(rIdx,cIdx)} style={{width:'100%', height:'100%', background:'transparent', border:'none', cursor:'pointer'}}>{rIdx},{cIdx}</button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{marginTop:16}}>
            <h4>Vaše rezervacije</h4>
            {reservations.filter(r=> r.email=== user?.email).length===0? <div>Nimate rezervacij.</div> : (
              <ul>
                {reservations.filter(r=> r.email=== user?.email).map(r=> (<li key={r.id}>Stol {r.row},{r.col} - <button onClick={()=> cancel(r.id)} style={{textDecoration:'underline', background:'transparent', border:'none', cursor:'pointer'}}>Prekliči</button></li>))}
              </ul>
            )}
          </div>
        </section>
      )}

    </div>
  )
}
