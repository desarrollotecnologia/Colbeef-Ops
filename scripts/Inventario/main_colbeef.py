import customtkinter as ctk
import mysql.connector
from tkinter import messagebox, ttk
import pandas as pd
from tkinter import filedialog
import os
import sys

# Configuración institucional
ctk.set_appearance_mode("System")
ctk.set_default_color_theme("blue")

class LoginWindow(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Acceso COLBEEF S.A.S")
        self.geometry("400x420")
        self.resizable(False, False)
        self.user_data = None 

        self.frame = ctk.CTkFrame(self)
        self.frame.pack(pady=30, padx=30, fill="both", expand=True)

        ctk.CTkLabel(self.frame, text="Inventario de Subproductos", font=("Roboto", 22, "bold")).pack(pady=20)
        
        self.user_entry = ctk.CTkEntry(self.frame, placeholder_text="Nombre o Correo", height=35)
        self.user_entry.pack(pady=10, padx=30, fill="x")
        
        self.pass_entry = ctk.CTkEntry(self.frame, placeholder_text="Contraseña", show="*", height=35)
        self.pass_entry.pack(pady=10, padx=30, fill="x")

        self.btn_login = ctk.CTkButton(self.frame, text="Iniciar Sesión", height=40, command=self.validar_acceso)
        self.btn_login.pack(pady=30, padx=30, fill="x")

    def conectar(self):
        return mysql.connector.connect(
            host='192.168.20.205',
            user='dev_colbeef',
            password='Colbeef2026*',
            database='inventario_subproductos',
            connect_timeout=5
        )

    def validar_acceso(self):
        identificador = self.user_entry.get()
        p = self.pass_entry.get()
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            query = "SELECT correo, nombre FROM usuarios WHERE (nombre = %s OR correo = %s) AND PASSWORD = %s"
            cursor.execute(query, (identificador, identificador, p))
            resultado = cursor.fetchone()
            
            if resultado:
                self.user_data = resultado 
                self.withdraw() 
                self.quit()     
            else:
                messagebox.showerror("Error", "Credenciales incorrectas")
            conn.close()
        except Exception as e:
            messagebox.showerror("Error de Red", "No se pudo alcanzar el servidor de COLBEEF.")

class AppColbeef(ctk.CTk):
    def __init__(self, datos_usuario):
        super().__init__()
        self.correo_activo = datos_usuario[0]
        self.nombre_activo = datos_usuario[1]

        self.title(f"COLBEEF S.A.S | Sesión: {self.nombre_activo}")
        self.geometry("1250x750")
        self.protocol("WM_DELETE_WINDOW", self.on_closing)

        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # BARRA LATERAL
        self.sidebar = ctk.CTkFrame(self, width=220, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        ctk.CTkLabel(self.sidebar, text="COLBEEF", font=("Roboto", 24, "bold")).pack(pady=20)

        ctk.CTkButton(self.sidebar, text="Actualizar Stock", command=self.mostrar_stock).pack(pady=10, padx=20)
        ctk.CTkButton(self.sidebar, text="+ Ingreso", fg_color="#2ECC71", command=self.abrir_ventana_ingreso).pack(pady=10, padx=20)
        ctk.CTkButton(self.sidebar, text="- Salida", fg_color="#C0392B", command=self.abrir_ventana_salida).pack(pady=10, padx=20)
        ctk.CTkButton(self.sidebar, text="! Merma", fg_color="#F39C12", text_color="black", command=self.abrir_ventana_merma).pack(pady=10, padx=20)
        ctk.CTkButton(self.sidebar, text="Historial", fg_color="#34495E", command=self.abrir_ventana_historial).pack(pady=10, padx=20)
        ctk.CTkButton(self.sidebar, text="Exportar Excel", fg_color="#1D6F42", command=self.exportar_excel).pack(pady=25, padx=20)
        
        self.btn_logout = ctk.CTkButton(self.sidebar, text="Cerrar Sesión", fg_color="transparent", border_width=2, text_color="red", border_color="red", command=self.cerrar_sesion)
        self.btn_logout.pack(side="bottom", pady=20, padx=20)

        # PANEL CENTRAL
        self.main_frame = ctk.CTkFrame(self)
        self.main_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")
        self.txt_inventario = ctk.CTkTextbox(self.main_frame, width=800, height=500, font=("Courier New", 18))
        self.txt_inventario.pack(pady=20, padx=20, fill="both", expand=True)

        self.mostrar_stock()

    def conectar(self):
        return mysql.connector.connect(host='192.168.20.205', user='dev_colbeef', password='Colbeef2026*', database='inventario_subproductos')

    def mostrar_stock(self):
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            query = """
            SELECT PRODUCTO, 
            SUM(CASE WHEN TIPO_DE_MOVIMIENTO IN ('INGRESO DE PRODUCCION', 'ENTRADA POR AJUSTE') THEN PESO ELSE 0 END) -
            SUM(CASE WHEN TIPO_DE_MOVIMIENTO IN ('MERMA', 'SALIDA POR DESPACHO') THEN PESO ELSE 0 END) AS stock
            FROM movimientos GROUP BY PRODUCTO
            """
            cursor.execute(query)
            datos = cursor.fetchall()
            self.txt_inventario.delete("1.0", "end")
            self.txt_inventario.insert("end", f"{'PRODUCTO':<25} | {'STOCK ACTUAL (KG)':>18}\n" + "="*50 + "\n")
            for p, s in datos:
                self.txt_inventario.insert("end", f"{p:<25} | {s:18,.2f} kg\n")
            conn.close()
        except: pass

    def guardar_registro(self, tipo, prod, peso, remision="", ventana=None):
        try:
            p = float(peso.replace(',', '.'))
            conn = self.conectar()
            cursor = conn.cursor()
            query = """INSERT INTO movimientos 
                       (FECHA, TIPO_DE_MOVIMIENTO, PRODUCTO, PESO, REMISION, USUARIO, NOMBRE_USUARIO, ALMACEN_ORIGEN) 
                       VALUES (NOW(), %s, %s, %s, %s, %s, %s, 'PROCESO')"""
            cursor.execute(query, (tipo, prod, p, remision, self.correo_activo, self.nombre_activo))
            conn.commit()
            conn.close()
            if ventana: ventana.destroy()
            self.mostrar_stock()
        except: messagebox.showwarning("Error", "Ingrese un peso válido.")

    # --- HISTORIAL CON BUSCADOR ---
    def abrir_ventana_historial(self):
        v = ctk.CTkToplevel(self); v.title("Historial Detallado"); v.geometry("1200x700"); v.attributes("-topmost", True)
        
        # Frame de Búsqueda
        search_frame = ctk.CTkFrame(v)
        search_frame.pack(fill="x", padx=20, pady=10)
        
        ctk.CTkLabel(search_frame, text="Buscar:").pack(side="left", padx=10)
        entry_busqueda = ctk.CTkEntry(search_frame, placeholder_text="Producto o Responsable...", width=300)
        entry_busqueda.pack(side="left", padx=10, pady=10)
        
        # Frame de Tabla
        table_frame = ctk.CTkFrame(v)
        table_frame.pack(fill="both", expand=True, padx=20, pady=10)
        
        cols = ("id", "producto", "peso", "tipo", "rem", "fecha", "responsable")
        tabla = ttk.Treeview(table_frame, columns=cols, show="headings")
        for c in cols: tabla.heading(c, text=c.upper()); tabla.column(c, width=130, anchor="center")
        
        scrollbar = ttk.Scrollbar(table_frame, orient="vertical", command=tabla.yview)
        tabla.configure(yscroll=scrollbar.set)
        tabla.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        def cargar_datos(filtro=""):
            for item in tabla.get_children(): tabla.delete(item)
            conn = self.conectar(); cursor = conn.cursor()
            if filtro:
                query = "SELECT ID_MOVIMIENTOS, PRODUCTO, PESO, TIPO_DE_MOVIMIENTO, REMISION, FECHA, NOMBRE_USUARIO FROM movimientos WHERE PRODUCTO LIKE %s OR NOMBRE_USUARIO LIKE %s ORDER BY FECHA DESC LIMIT 300"
                cursor.execute(query, (f"%{filtro}%", f"%{filtro}%"))
            else:
                cursor.execute("SELECT ID_MOVIMIENTOS, PRODUCTO, PESO, TIPO_DE_MOVIMIENTO, REMISION, FECHA, NOMBRE_USUARIO FROM movimientos ORDER BY FECHA DESC LIMIT 300")
            
            for f in cursor.fetchall(): tabla.insert("", "end", values=f)
            conn.close()

        # Evento de búsqueda en tiempo real
        entry_busqueda.bind("<KeyRelease>", lambda e: cargar_datos(entry_busqueda.get()))
        
        ctk.CTkButton(search_frame, text="Refrescar", width=100, command=lambda: cargar_datos()).pack(side="right", padx=10)
        
        cargar_datos()

    def abrir_ventana_ingreso(self):
        v = ctk.CTkToplevel(self); v.title("Ingreso"); v.geometry("400x350"); v.attributes("-topmost", True)
        c = ctk.CTkComboBox(v, width=250, values=["BILIS", "BORLAS", "ESOFAGOS", "TRAQUEAS", "VEJIGAS", "VIRILES"]); c.pack(pady=20)
        e = ctk.CTkEntry(v, placeholder_text="Peso KG", width=250); e.pack(pady=10)
        ctk.CTkButton(v, text="Guardar", fg_color="#2ECC71", command=lambda: self.guardar_registro("INGRESO DE PRODUCCION", c.get(), e.get(), "", v)).pack(pady=20)

    def abrir_ventana_salida(self):
        v = ctk.CTkToplevel(self); v.title("Salida"); v.geometry("400x400"); v.attributes("-topmost", True)
        c = ctk.CTkComboBox(v, width=250, values=["BILIS", "BORLAS", "ESOFAGOS", "TRAQUEAS", "VEJIGAS", "VIRILES"]); c.pack(pady=20)
        e = ctk.CTkEntry(v, placeholder_text="Peso KG", width=250); e.pack(pady=10)
        r = ctk.CTkEntry(v, placeholder_text="Remisión", width=250); r.pack(pady=10)
        ctk.CTkButton(v, text="Despachar", fg_color="#C0392B", command=lambda: self.guardar_registro("SALIDA POR DESPACHO", c.get(), e.get(), r.get(), v)).pack(pady=20)

    def abrir_ventana_merma(self):
        v = ctk.CTkToplevel(self); v.title("Merma"); v.geometry("400x400"); v.attributes("-topmost", True)
        c = ctk.CTkComboBox(v, width=250, values=["BILIS", "BORLAS", "ESOFAGOS", "TRAQUEAS", "VEJIGAS", "VIRILES"]); c.pack(pady=20)
        e = ctk.CTkEntry(v, placeholder_text="Peso KG", width=250); e.pack(pady=10)
        j = ctk.CTkEntry(v, placeholder_text="Causa", width=250); j.pack(pady=10)
        ctk.CTkButton(v, text="Guardar Merma", fg_color="#F39C12", text_color="black", command=lambda: self.guardar_registro("MERMA", c.get(), e.get(), j.get(), v)).pack(pady=20)

    def cerrar_sesion(self):
        if messagebox.askyesno("Salir", "¿Cerrar sesión actual?"):
            self.destroy()
            os.execl(sys.executable, sys.executable, *sys.argv)

    def on_closing(self):
        self.destroy()
        os._exit(0)

    def exportar_excel(self):
        try:
            conn = self.conectar()
            df = pd.read_sql("SELECT * FROM movimientos ORDER BY FECHA DESC", conn)
            ruta = filedialog.asksaveasfilename(defaultextension=".xlsx", initialfile="INVENTARIO_COLBEEF.xlsx")
            if ruta: df.to_excel(ruta, index=False)
            conn.close()
        except: pass

if __name__ == "__main__":
    login = LoginWindow()
    login.mainloop()
    if login.user_data:
        app = AppColbeef(login.user_data)
        app.mainloop()
        