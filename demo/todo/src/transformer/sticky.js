export default () => Component => class extends Component {
    afterRender() {
        super.afterRender();

        let element = this.refs.$main;

        window.addEventListener(
            'scroll',
            () => {
                let scrollTop = document.scrollTop || document.body.scrollTop;
                if (element.offsetTop < scrollTop) {
                    element.style.position = 'fixed';
                    element.classList.add('sticky');
                }
                else {
                    element.style.position = '';
                    element.classList.remove('sticky');
                }
            }
        );
    }
}
