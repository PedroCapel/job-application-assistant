import asyncio, json, pathlib, base64
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent.parent
profile = {"firstName":"Ana","lastName":"Souza","email":"ana@example.com","phone":"11999990000","phoneCountry":"Brazil","city":"Recife","country":"Brazil",
 "linkedin":"linkedin.com/in/ana-souza","currentCompany":"Acme","employmentType":"Employee","yearsTotal":"6","english":"Advanced",
 "salaryMonthlyUSD":"3200","salaryAnnualUSD":"USD 40,000 per year","salaryHourlyUSD":"20","availability":"Within 15 days",
 "workAuthorized":"Yes","needsSponsorship":"No","usClients":"Yes","inLatam":"Yes","yearsByTech":{"azure":"2"},
 "customAnswers":[{"match":"favorite song","answer":"Aquarela"}],
 "coverLetter":"Dear Hiring Team, I am applying for the {cargo} position at {empresa}.",
 "resume":{"name":"cv.pdf","type":"application/pdf","dataUrl":"data:application/pdf;base64,"+base64.b64encode(b"%PDF-1.4 test").decode()}}
mock = "window.chrome={storage:{local:{get:(d,cb)=>cb({profile:%s})}},runtime:{onMessage:{addListener(){}}}};" % json.dumps(profile)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.add_init_script(mock)
        await pg.goto((root/"test/form.html").as_uri())
        await pg.add_script_tag(path=str(root/"rules.js")); await pg.add_script_tag(path=str(root/"content.js"))
        await pg.click("#pv-btn"); await pg.wait_for_selector("#pv-panel")
        vals = await pg.evaluate("""()=>({first:first_name.value,last:last_name.value,pref:pref.value,email:email.value,phone:phone.value,
          li:li.value,sal:sal.value,az:az.value,song:song.value,unk:unk.value,gender:gender.value,
          emp:emp.value,yrs:yrs.value,eng:eng.value,auth:document.querySelector('[name=auth]:checked')?.value,
          latam:document.querySelector('.val').textContent,cl:cl.value,file:resume.files[0]?.name,submitted:window.submitted,
          panel:document.getElementById('pv-panel').innerText})""")
        await b.close()
        exp = {"first":"Ana","last":"Souza","pref":"","email":"ana@example.com","phone":"11999990000","li":"linkedin.com/in/ana-souza","sal":"3200","az":"2",
               "song":"Aquarela","unk":"","gender":"","emp":"Employee","yrs":"5+ years","eng":"Fluent and spontaneous (Advanced).","auth":"1","latam":"Yes",
               "cl":"Dear Hiring Team, I am applying for the Data Engineer position at Acme Data.","file":"cv.pdf","submitted":False}
        bad = {k:(vals[k],v) for k,v in exp.items() if vals[k]!=v}
        print("ERROS JS:", errs); print("DIVERGENCIAS:", bad or "nenhuma"); print(vals["panel"])
asyncio.run(main())
