import React, { Component } from 'react';

import dynamic from 'next/dynamic';
const VideoPlayer = dynamic(() => import('../components/videoplayer'), { ssr: false })
const Chat = dynamic(() => import('../components/chat'), { ssr: false })

import Layout from '../components/layout'
import Header from '../components/header'
import Footer from '../components/footer'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import '../styles/nda.scss'
 
class NDA extends Component {
	static getInitialProps({ req }) {
		let isDev = process.env.NODE_ENV === "development";
		return { isDev };
	}

	constructor (props) {
		super(props)

		this.store = props.store
		this.state = {
			isNDA: false,
			authorization: null,
			baseUrl: this.props.isDev ? "http://127.0.0.1:6969" : "https://timcole.me/api",
			isChatHidden: false
		}

		this.login = this.login.bind(this);
		this.toggleChat = this.toggleChat.bind(this);
		this.popoutChat = this.popoutChat.bind(this);
	}

	componentDidUpdate () { this._checkAuth(); }
	componentDidMount () { this._checkAuth(); }
	async _checkAuth() {
		let { authorization } = this.state;
		let storedAuth = localStorage.getItem("Authorization");
		if (storedAuth == authorization) return;
		authorization = storedAuth
		this.setState({ authorization })

		const ok = (await fetch(`${this.state.baseUrl}/nda/ping`, {
			headers: { "Authorization": authorization }
		}).then(data => data.text()));
		this.setState({ isNDA: ok === "ok" })
	}

	updateValue (e) {
		e.target.setAttribute('data-value', e.target.value)
		if (e.keyCode != 13) return;
		if (e.target.dataset.type === "username") document.querySelector('[data-type="password"]').focus();
		// if (e.target.dataset.type === "password") document.querySelector('input[type="submit"]').click();
	}

	async login () {
		let [username, password] = [
			document.querySelector('[data-type="username"]').value,
			document.querySelector('[data-type="password"]').value,
		];
		if (username == "" || password == "") return;

		const { error, jwt, username: name } = (await fetch(`${this.state.baseUrl}/login`, {
			method: "POST",
			body: JSON.stringify({ username, password })
		}).then(data => data.json()));
		if (error) return alert(error);
		if (!jwt) return alert("No auth Authorizatione, jwt returned from the server. Try again later.");
		localStorage.setItem("Authorization", jwt);
		localStorage.setItem("Username", name);
		location.reload();
	}

	toggleChat () {
		const { isChatHidden } = this.state;
		this.setState({ isChatHidden: !isChatHidden });
	}

	popoutChat () {
		window.open("/nda#chat", "_blank", "toolbar=0,location=0,menubar=0,width=450,height=900");
		this.setState({ isChatHidden: true });
	}

	render () {
		const { authorization, isNDA, isChatHidden } = this.state;
		const { isDev } = this.props;
		if (!isNDA) return (
			<Layout title={`Timothy Cole - NDA Login`} className="nda-login">
				<div className="header"><Header className="container" store={this.store} /></div>
				<div className="body">
					<h1>Unauthorized</h1>
					<form onSubmit={e => e.preventDefault()} className="login" method="POST">
						<fieldset>
							<input
								data-type="username"
								type="text"
								data-value=""
								onKeyUp={this.updateValue} />
							<hr /><label>Username</label>
						</fieldset>
						<fieldset>
							<input
								data-type="password"
								type="password"
								data-value=""
								onKeyUp={this.updateValue} />
							<hr /><label>Password</label>
						</fieldset>
						<input type="submit" value="Login" onClick={this.login} />
					</form>
					<Footer />
				</div>
			</Layout>
		);

		const options = {
			authorization,
			autoplay: true,
			controls: false,
			muted: true,
			hlsConfig: {
				liveSyncPosition: 3000
			}
		};

		const isChatOnly = window.location.hash == "#chat";
		return (
			<Layout title={`Timothy Cole - NDA`} className="nda">
				<div className="header"><Header className="container" store={this.store} /></div>
				<div className="body">
					{isChatOnly ? '' : <VideoPlayer { ...options } />}
					{isChatOnly ? '' : (
						<div class="chatControls">
							<FontAwesomeIcon onClick={this.toggleChat} className={`hideChat ${isChatHidden ? "isChatHidden" : ""}`} icon={['fas', 'play']} />
							<FontAwesomeIcon onClick={this.popoutChat} className="popoutChat" icon={['fas', 'external-link-square']} />
						</div>
					)}
					<Chat isChatHidden={isChatHidden} isChatOnly={isChatOnly} isDev={isDev} authorization={authorization} />
				</div>
			</Layout>
		)
	}
}

export default NDA;